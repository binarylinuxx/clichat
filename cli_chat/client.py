
import asyncio
import curses
import json
import websockets
import datetime
import time

# A list to store chat messages. Each message is a tuple: (timestamp, sender, text)
chat_history = []
MAX_MESSAGES = 100
SERVER_URI = "ws://localhost:8765"

async def receive_messages(websocket):
    """Listens for incoming messages from the server and adds them to the chat history."""
    global chat_history
    async for message in websocket:
        data = json.loads(message)
        timestamp = datetime.datetime.now()
        chat_history.append((timestamp, data['sender'], data['text']))
        # Trim history
        if len(chat_history) > MAX_MESSAGES:
            chat_history = chat_history[-MAX_MESSAGES:]

async def run_chat_ui(stdscr):
    """The main async function that runs the chat UI and handles network I/O."""
    global chat_history

    # --- Curses Setup ---
    curses.curs_set(1)
    stdscr.nodelay(True)
    stdscr.timeout(100)
    curses.start_color()
    curses.init_pair(1, curses.COLOR_CYAN, curses.COLOR_BLACK)
    curses.init_pair(2, curses.COLOR_WHITE, curses.COLOR_BLACK)
    curses.init_pair(3, curses.COLOR_YELLOW, curses.COLOR_BLACK)
    curses.init_pair(4, curses.COLOR_MAGENTA, curses.COLOR_BLACK) # Other users

    # --- Get User Name ---
    user_name = get_name_input(stdscr)
    if not user_name:
        return

    # --- WebSocket Connection ---
    try:
        async with websockets.connect(SERVER_URI) as websocket:
            # Add a system message for successful connection
            chat_history.append((datetime.datetime.now(), "System", f"Connected to {SERVER_URI} as {user_name}"))
            
            # Start the background task to listen for messages
            receiver_task = asyncio.create_task(receive_messages(websocket))

            input_text = ""
            
            # --- Main UI Loop ---
            while True:
                if receiver_task.done():
                    chat_history.append((datetime.datetime.now(), "System", "Connection to server lost. Press ESC to exit."))
                    draw_chat_history(stdscr, stdscr.getmaxyx()[0], stdscr.getmaxyx()[1], user_name)
                    stdscr.refresh()
                    while stdscr.getch() != 27:
                        time.sleep(0.1)
                    break

                # 1. Draw all UI elements
                height, width = stdscr.getmaxyx()
                stdscr.clear()
                draw_notice(stdscr, width)
                draw_chat_history(stdscr, height, width, user_name)
                draw_input_box(stdscr, height, width, input_text)
                
                # 2. Explicitly move cursor to the input field after drawing
                stdscr.move(height - 2, 5 + len(input_text))
                
                # 3. Refresh the screen to show changes and cursor position
                stdscr.refresh()

                # 4. Get user input (non-blocking)
                try:
                    key = stdscr.getch()
                except curses.error:
                    key = -1

                # 5. Process input and update state
                if key == curses.KEY_ENTER or key in [10, 13]:
                    if input_text:
                        timestamp = datetime.datetime.now()
                        chat_history.append((timestamp, user_name, input_text))
                        if len(chat_history) > MAX_MESSAGES:
                            chat_history = chat_history[-MAX_MESSAGES:]
                        
                        message_to_send = json.dumps({"sender": user_name, "text": input_text})
                        await websocket.send(message_to_send)
                        
                        input_text = ""
                elif key == curses.KEY_BACKSPACE or key == 127:
                    input_text = input_text[:-1]
                elif key == 27: # ESC to exit
                    break
                elif key != -1:
                    try:
                        # Filter out non-printable characters
                        if 32 <= key <= 126:
                            input_text += chr(key)
                    except ValueError:
                        pass
                
                await asyncio.sleep(0.01) # Yield control to the event loop

            # Clean up the receiver task when exiting
            receiver_task.cancel()
            try:
                await receiver_task
            except asyncio.CancelledError:
                pass

    except (websockets.exceptions.ConnectionClosedError, ConnectionRefusedError):
        # Handle connection failure
        stdscr.clear()
        msg = f"Could not connect to server at {SERVER_URI}. Is it running?"
        stdscr.addstr(0, 0, msg)
        stdscr.addstr(2, 0, "Press any key to exit.")
        stdscr.nodelay(False)
        stdscr.getch()


def get_name_input(stdscr):
    """Gets the user's name before starting the chat."""
    stdscr.nodelay(False) # Make getch blocking for this part
    stdscr.clear()
    height, width = stdscr.getmaxyx()
    prompt = "Input your Name: "
    name = ""
    while True:
        stdscr.clear()
        stdscr.addstr(height // 2, (width - len(prompt) - 10) // 2, prompt, curses.A_BOLD)
        stdscr.addstr(name)
        stdscr.refresh()
        key = stdscr.getch()
        if key == curses.KEY_ENTER or key in [10, 13]:
            stdscr.nodelay(True) # Restore non-blocking
            return name if name else "User"
        elif key == curses.KEY_BACKSPACE or key == 127:
            name = name[:-1]
        elif key == 27:
            return None
        elif key != -1 and 32 <= key <= 126:
            name += chr(key)

# --- Drawing Functions (similar to before) ---

def draw_notice(stdscr, width):
    notice_text = "Your Account will be destroyed once your session destroyed and each message before 100 auto delete to optimize storage"
    stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
    stdscr.addstr(0, 0, notice_text.ljust(width))
    stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
    stdscr.addstr(1, 0, "=" * width)

def draw_chat_history(stdscr, height, width, user_name):
    chat_win_height = height - 4
    chat_win = curses.newwin(chat_win_height, width, 2, 0)
    y = chat_win_height - 1
    for timestamp, sender, text in reversed(chat_history):
        if y < 0: break
        time_str = timestamp.strftime('%H:%M:%S')
        line = f"[{time_str}] {sender}: {text}"
        if len(line) > width: line = line[:width-3] + "..."
        
        color = curses.color_pair(4) # Other users
        if sender == user_name: color = curses.color_pair(3) # My messages
        elif sender == "System": color = curses.color_pair(1) # System messages
        
        chat_win.addstr(y, 1, line, color)
        y -= 1
    chat_win.refresh()

def draw_input_box(stdscr, height, width, input_text):
    stdscr.addstr(height - 3, 0, "=" * width)
    prompt = ">>_ "
    stdscr.addstr(height - 2, 1, prompt, curses.A_BOLD)
    stdscr.addstr(input_text, curses.color_pair(3))

def main_wrapper(stdscr):
    """Wrapper to run the asyncio event loop."""
    asyncio.run(run_chat_ui(stdscr))

if __name__ == "__main__":
    print("Starting chat client...")
    try:
        curses.wrapper(main_wrapper)
        print("Chat session ended.")
    except Exception as e:
        print(f"An error occurred: {e}")


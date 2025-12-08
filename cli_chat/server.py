import asyncio
import websockets
import json
import datetime

# A set to keep track of all connected clients (websockets).
CONNECTED_CLIENTS = set()

async def handler(websocket, path):
    """
    Handles a new WebSocket connection.
    One instance of this function runs for each client.
    """
    # Add the new client to our set of connected clients.
    CONNECTED_CLIENTS.add(websocket)
    print(f"New client connected. Total clients: {len(CONNECTED_CLIENTS)}")
    
    try:
        # The server will listen for messages from this client indefinitely.
        async for message in websocket:
            print(f"Received message from a client: {message}")
            
            # We don't want to send the message back to the original sender.
            # We will create a list of other clients to send the message to.
            other_clients = [client for client in CONNECTED_CLIENTS if client != websocket]
            
            # If there are other clients, broadcast the message to them.
            if other_clients:
                # The websockets.broadcast function is efficient for sending to many.
                await websockets.broadcast(other_clients, message)
                print(f"Broadcasted message to {len(other_clients)} clients.")

    except websockets.exceptions.ConnectionClosedError:
        print("A client connection was closed unexpectedly.")
    finally:
        # When the client disconnects (for any reason), remove them from the set.
        CONNECTED_CLIENTS.remove(websocket)
        print(f"Client disconnected. Remaining clients: {len(CONNECTED_CLIENTS)}")

async def main():
    """The main function to start the WebSocket server."""
    host = "localhost"
    port = 8765
    
    # Start the WebSocket server.
    # The `handler` function will be called for each new connection.
    async with websockets.serve(handler, host, port):
        print(f"WebSocket server started at ws://{host}:{port}")
        # The server will run forever until it's manually stopped.
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server is shutting down.")
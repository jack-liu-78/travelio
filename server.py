import asyncio
import datetime
import random
import websockets
import json

USERS = set()
budgetItems = []
events = [[] for i in range(7)]


async def register(websocket):
    USERS.add(websocket)

async def unregister(websocket):
    USERS.remove(websocket)

async def update_users():
    global events
    global budgetItems
    for user in USERS:
        await send_data(user, json.dumps({'type': 'event', 'data': events}))
        await send_data(user, json.dumps({'type': 'budget', 'data': budgetItems}))

async def send_data(user, data):
    await user.send(data)
    await user.send(data)
    print('sent', user)

async def time(websocket, path):
    global budgetItems
    global events
    try:
        if websocket not in USERS:
            await register(websocket)
            # print('here', websocket)
            # now = datetime.datetime.utcnow().isoformat() + "Z"
            # await websocket.send(now)
            # await websocket.send(json.dumps(str(counter)))
            # await notify_users()
            print(USERS)
        async for message in websocket:
            data = json.loads(message)
            print(data)
            if(data['type'] == 'budget'):
                budgetItems.append({'name': data['name'], 'cost': data['cost']})
                # await websocket.send(json.dumps({'type': 'budget', 'data': budgetItems}))
                print(budgetItems)
            elif(data['type'] == 'event'):
                events[data['day']].append({'name': data['name'], 'cost': data['cost']})
                # await websocket.send(json.dumps({'type': 'event', 'data': events}))
                print(events)
            # test = await websocket.send(data)
            # print(test)
            elif(data['type'] == 'reset'):
                budgetItems = []
                events = [[] for i in range(7)]
            await update_users()
    finally:
        print('no connection')
        await unregister(websocket)

start_server = websockets.serve(time, "127.0.0.1", 1112)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

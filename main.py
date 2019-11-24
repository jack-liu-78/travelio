import json
from flask import Flask, render_template, request, jsonify
import threading
from flights_accomodations import get_flights, get_accomodations
from flask_sockets import Sockets

app = Flask(__name__)
sockets = Sockets(app)

destination = ''

@app.route("/home")
def index():
    return render_template("index.html", destination = destination)

@app.route("/setDestination", methods = ['POST'])
def setDestination():
    global destination
    destination = request.form['destination'].lower().capitalize()
    print(destination)
    return 'OK'

@app.route("/acco", methods=["POST"])
def acco():
    print(request.form)
    data = {
        'city': request.form['city'],
        'checkin': request.form['checkin'],
        'checkout': request.form['checkout'],
        'numPeople': request.form['numPeople']
    }
    ret = get_accomodations(data['city'], data['checkin'], data['checkout'], data['numPeople'])
    print(ret)
    return jsonify(ret)

@app.route("/flights", methods=["POST"])
def flights():
    data = {
        'depart': request.form['depart'],
        'return': request.form['return'],
        'startPoint': request.form['startPoint'],
        'destination': request.form['destination']
    }
    ret = get_flights(data['depart'], data['return'], data['startPoint'], data['destination'])
    print(ret)
    return jsonify(ret)

USERS = set()
budgetItems = []
events = []
userList = []

def update_users(clients, ws):
    global events
    global budgetItems
    for client in clients:
        client.ws.send(json.dumps({'type': 'event', 'data': events}))
        client.ws.send(json.dumps({'type': 'budget', 'data': budgetItems}))

def update_user_list(clients, ws):
    for client in clients:
        client.ws.send(json.dumps({'type': 'userList', 'data': userList}))

def reset_users(clients, ws):
    for client in clients:
        client.ws.send(json.dumps({'type': 'reset'}))

@sockets.route('/')
def socket_comms(ws):
    while not ws.closed:
        message = ws.receive()
        if message is None:  # message is "None" if the client has closed.
            continue
        global budgetItems
        global events
        global userList
        clients = ws.handler.server.clients.values()
        data = json.loads(message)
        if(data['type'] == 'budget'):
            budgetItems.append({'person': data['person'], 'name': data['name'], 'cost': data['cost']})
            update_users(clients, ws)
        elif(data['type'] == 'event'):
            events[data['day']].append({'name': data['name'], 'cost': data['cost']})
            update_users(clients, ws)
        elif(data['type'] == 'reset'):
            budgetItems = []
            events = []
            userList = []
            reset_users(clients, ws)
        elif(data['type'] == 'userList'):
            userList.append(data['data'][-1])
            update_user_list(clients, ws)
        elif(data['type'] == 'eventsArr'):
            events = data['data']
            update_users(clients, ws)

if __name__ == '__main__':
    print("bla")

# async def register(websocket):
#     USERS.add(websocket)

# async def unregister(websocket):
#     USERS.remove(websocket)

# async def update_users():
#     global events
#     global budgetItems
#     for user in USERS:
#         await send_data(user, json.dumps({'type': 'event', 'data': events}))
#         await send_data(user, json.dumps({'type': 'budget', 'data': budgetItems}))

# async def update_user_list():
#     global userList
#     for user in USERS:
#         await send_data(user, json.dumps({'type': 'userList', 'data': userList}))

# async def reset_users():
#     for user in USERS:
#         await send_data(user, json.dumps({'type': 'reset'}))

# async def send_data(user, data):
#     await user.send(data)

# async def time(websocket, path):
#     global budgetItems
#     global events
#     global userList
#     try:
#         if websocket not in USERS:
#             await register(websocket)
#             # print('here', websocket)
#             # now = datetime.datetime.utcnow().isoformat() + "Z"
#             # await websocket.send(now)
#             # await websocket.send(json.dumps(str(counter)))
#             # await notify_users()
#         async for message in websocket:
#             data = json.loads(message)
#             print(data)
#             if(data['type'] == 'budget'):
#                 budgetItems.append({'person': data['person'], 'name': data['name'], 'cost': data['cost']})
#                 await update_users()
#                 # await websocket.send(json.dumps({'type': 'budget', 'data': budgetItems}))
#             elif(data['type'] == 'event'):
    #             events[data['day']].append({'name': data['name'], 'cost': data['cost']})
    #             await update_users()
    #             # await websocket.send(json.dumps({'type': 'event', 'data': events}))
    #         # test = await websocket.send(data)
    #         # print(test)
    #         elif(data['type'] == 'reset'):
    #             budgetItems = []
    #             events = []
    #             userList = []
    #             # await update_users()
    #             # await update_user_list()
    #             await reset_users()
    #         elif(data['type'] == 'userList'):
    #             userList.append(data['data'][-1])
    #             # print(userList)
    #             await update_user_list()
    #         elif(data['type'] == 'eventsArr'):
    #             events = data['data']
    #             await update_users()
    # finally:
    #     print('no connection')
    #     await unregister(websocket)

#start_server = websockets.serve(time, "127.0.0.1", 1112)

#asyncio.get_event_loop().run_until_complete(start_server)
#asyncio.get_event_loop().run_forever()
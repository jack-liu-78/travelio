var weekdays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];
/*
1. landing page
2. pick dates with popup
3. generate events array with just that many days
4. let the week frame be scrollable only within that time period
5. send link to other people
6. those people pick dates as well
7. only show a date range that fits what everyone picks

- store the latest starting date and earliest ending date as the limits of the trip
- events can be indexed based on [0] to [length - 1], then add an offset when calculating the days to show
    - offset is the earliest starting date

- in event creation dialogue, only allow a choice within the date range? or just pick within for the demo
*/

var events = [[],[],[],[],[],[],[]];

var budgetItems = [];

var startingDay = 0;

var destination = "";

var ws = new WebSocket("ws://127.0.0.1:1112")

function leaveLanding(e) {
    e.preventDefault();
    
}

function loadDays() {
    for (let i = 0; i < weekdays.length; i++) {
        document.getElementById("week-day-name-" + ((i + startingDay) % 7).toString()).innerHTML = weekdays[i];
    }
}

function render() {
    loadDays();
    loadBudget();
    loadEvents();
}

function resetAll() {
    startingDay = 0;
    events = [[],[],[],[],[],[],[]];
    budgetItems = [];
    if (isSwitched) handleSwitch();
    ws.send(JSON.stringify({type: 'reset'}));
    render();
}

function loadBudget() {
    document.getElementById("budget-items").innerHTML = "";
    for (let i = 0; i < budgetItems.length; i++) {
        let item = budgetItems[i];
        document.getElementById("budget-items").innerHTML += "<li>" + item.name + ": $" + item.cost + "</li>"
    }
}

function addBudgetItem(name, cost) {
    let item = {name: name, cost: cost};
    ws.send(JSON.stringify({type: 'budget', name: name, cost:cost}))
    budgetItems.push(item);
    loadBudget();
}

function loadEvents() {
    for (let i = 0; i < 7; i++) {
        document.getElementById(`week-${i}-events`).innerHTML = "";
    }
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < events[i].length; j++) {
            document.getElementById(`week-${i}-events`).innerHTML +=
            `<div class="event">
                <div class="event-title">${events[i][j].name}</div>
                <div class="event-cost">${events[i][j].cost}</div>
            </div>`;
        }
    }
}

function addEvent(name, cost, day) {
    let c = cost;
    let d = day;
    if (name == "random") {
        c = Math.floor(Math.random() * 200 + 100);
        d = Math.floor(Math.random() * 7);
    ws.send(JSON.stringify({type:'event', name: name, cost: c, day: d}))
    }
    addBudgetItem(name, c);
    events[d].push({name: name, cost: c});
    document.getElementById(`week-${d}-events`).innerHTML +=
    `<div class="event">
        <div class="event-title">${name}</div>
        <div class="event-cost">$${c}</div>
    </div>`;
}

var isSwitched = false;
function handleSwitch() {
    if (!isSwitched) {
        $('#week-frame').animate({
            'width': '-=30%'
        }, 375);
        setTimeout(() => $('#budget-frame').fadeIn(375), 200);
        isSwitched = true;
    } else {
        $('#week-frame').animate({
            'width': '+=30%'
        }, 375);
        $('#budget-frame').fadeOut(100);
        isSwitched = false;
    }
}

ws.onmessage = function(serverData){
    data = JSON.parse(serverData.data)
    if(data['type'] == 'event'){
        events = data['data'];
        loadEvents();
    }
    else if(data['type'] == 'budget'){
        budgetItems = data['data'];
        loadBudget();
        if(budgetItems.length == 0){
            if (isSwitched) handleSwitch();
            render();
        }
    }
    else{
        console.log(data)
    }
}

render();
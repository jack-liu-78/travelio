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

/*
    - figure out availbility
        - display available days
    - format budget as a table
    - split costs functionality
    - move buttons at bottom to somewhere else
    - 'add to budget' popup ui
    - 'add event' popup ui
        - travel
        - accomodations
        - restaurants
        - custom
    - hosting (GCP)
        - integrating websockets
    - making it look pretty
*/
var events = [];

var budgetItems = [];

var people = [];

var startDate;
var endDate;

var dayDisplayOffset = 0;

var destination = "";

var totalCost = 0;

var ws = new WebSocket("ws://127.0.0.1:1112")

function leaveLanding(e) {
    e.preventDefault();
    destination = document.getElementById('destinationLocation').value;
    document.getElementById('destination-text').innerHTML = 
        destination[0].toUpperCase() + destination.substring(1, destination.length).toLowerCase();
    $('#landing-page').animate({
        'top': '-=100%'
    }, 1000);
    $('#landing-page').fadeOut(400);
}

$(function() {
    $('input[name="daterange"]').daterangepicker({
        opens: 'left'
    }, function(start, end, label) {
        let n = document.getElementById('inputFieldName').value;
        saveInputParams(n, start, end);
        console.log("A new date selection was made: " + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD'));
    });
});

function saveInputParams(n, start, end) {
    let setPerson = true;
    for (let i = 0; i < people.length; i++) {
        if (people[i].name == n) {
            people[i].aStart = start;
            people[i].aEnd = end;
            setPerson = false;
        }
    }
    if (setPerson) {
        people.push({name: n, aStart: start, aEnd: end});
    }
}

function leaveInput(e) {
    e.preventDefault();
    $('#input-page').fadeOut(400);
    let startDates = [];
    let endDates = [];
    for (let i = 0; i < people.length; i++) {
        startDates.push(people[i].aStart);
        endDates.push(people[i].aEnd);
    }
    startDate = moment.max(startDates);
    endDate = moment.min(endDates);
    let tripLength = moment.duration(startDate.diff(endDate)).days();
    let events = [];
    for (let i = 0; i < tripLength; i++) {
        events.push([]);
    }

    loadDays();
    loadPeople();
}

function loadPeople() {
    document.getElementById("people-coming").innerHTML = "";
    for (let i = 0; i < people.length; i++) {
        let p = people[i];
        document.getElementById("people-coming").innerHTML += 
        `<li>
            <div class="person-info">
                <div class="person-info-title">${p.name}</div>
                Availability
                <div class="person-info-time">Start: ${p.aStart.format('MM-DD-YYYY')}</div>
                <div class="person-info-time">End: ${p.aEnd.format('MM-DD-YYYY')}</div>
            </div>
        </li>`;
    }
}

function loadDays() {
    let tripLength = moment.duration(startDate.diff(endDate)).days();
    for (let i = 0; i < weekdays.length && i < tripLength; i++) {
        document.getElementById("week-day-name-" + i.toString()).innerHTML = 
            startDate.add(i, 'days').add(dayDisplayOffset, 'days').format("ddd, MMM Do YYYY");
    }
}

function changeDayDisplayOffset(direction) {
    if (direction == "left") {
        dayDisplayOffset -= 7;
    } else {
        dayDisplayOffset += 7;
    }
    loadDays();
}

function render() {
    loadDays();
    loadBudget();
    loadEvents();
    loadPeople();
}

function resetAll() {
    events = [];
    budgetItems = [];
    people = [];
    calculateBudget();
    if (isSwitched) handleSwitch();
    ws.send(JSON.stringify({type: 'reset'}));
    render();
}

function loadBudget() {
    var table = document.getElementById("budget-items");
    $("#budget-items tbody tr").remove();
    
    // document.getElementById("budget-items").innerHTML = "";
    if (budgetItems.length > 0){
        var headerRow = table.insertRow(-1);
        var hcell0 = document.createElement("TH");
        hcell0.innerHTML = "Person";
        headerRow.appendChild(hcell0)
        var hcell1 = document.createElement("TH");
        hcell1.innerHTML = "Item";        
        headerRow.appendChild(hcell1)
        var hcell2 = document.createElement("TH");
        hcell2.innerHTML = "Cost";
        headerRow.appendChild(hcell2)
    }
    for (let i = 0; i < budgetItems.length; i++) {
        let item = budgetItems[i];
        // document.getElementById("budget-items").innerHTML += "<li>" + item.name + ": $" + item.cost + "</li>"
        var row = table.insertRow();
        var cell0 = row.insertCell(0);
        var cell1 = row.insertCell(1);
        var cell2 = row.insertCell(2);
        cell0.innerHTML = item.person;
        cell1.innerHTML = item.name;
        cell2.innerHTML = "$" + item.cost;
    }
}

function addBudgetItem(person, name, cost) {
    if(typeof(person)=='object'){
        person = person.value;
        name = name.value;
        cost = cost.value;
    }
    let item = {person: person, name: name, cost: cost};
    ws.send(JSON.stringify({type: 'budget', person: person, name: name, cost:cost}))
    budgetItems.push(item);
    loadBudget();
    calculateBudget();
}

function calculateBudget(){
    totalCost = 0;
    for(i in budgetItems){
        totalCost+=parseInt(budgetItems[i]['cost']);
    }
    console.log(totalCost)
    document.getElementById('budget-total').innerHTML = totalCost;
}

$('#budgetModal').on('hidden.bs.modal', function (e) {
    $(this)
      .find("input,textarea")
         .val('')
         .end();
  })

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
    let person = 'eventPers'
    let c = cost;
    let d = day;
    if (name == "random") {
        c = Math.floor(Math.random() * 200 + 100);
        d = Math.floor(Math.random() * 7);
    ws.send(JSON.stringify({type:'event', name: name, cost: c, day: d}))
    }
    addBudgetItem(person, name, c);
    events[d].push({person: person, name: name, cost: c});
    document.getElementById(`week-${d}-events`).innerHTML +=
    `<div class="event">
        <div class="event-title">${name}</div>
        <div class="event-cost">$${c}</div>
    </div>`;
    calculateBudget();
}

var isSwitched = false;
function handleSwitch() {
    if (!isSwitched) {
        $('#week-frame').animate({
            'width': '=65%'
        }, 375);
        setTimeout(() => $('#budget-frame').fadeIn(375), 200);
        isSwitched = true;
    } else {
        $('#week-frame').animate({
            'width': '=90%'
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
            calculateBudget();
            if (isSwitched) handleSwitch();
            render();
        }
    }
    else{
        console.log(data)
    }
}
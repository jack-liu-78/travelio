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
5. send link to other people
6. those people pick dates as well
*/

/*
    - split costs functionality
    - move buttons at bottom to somewhere else
    - 'add event' popup ui
        - travel
        - accomodations
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

var nextEventDay = 0;
function setNextEventDay(i) { nextEventDay = i; }

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
        let e = moment(end);
        e.hour(0);
        e.minute(0);
        e.second(0);
        e.millisecond(0);
        saveInputParams(n, start, e);
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
    let tripLength = moment.duration(endDate.diff(startDate)).days();
    events = [];
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
    let tripLength = moment.duration(endDate.diff(startDate)).days();
    for (let i = 0; i < weekdays.length && i < tripLength; i++) {
        let iDate = moment(startDate);
        iDate = iDate.add(i, 'days').add(dayDisplayOffset, 'days');
        document.getElementById("week-day-name-" + i.toString()).innerHTML = 
            iDate.format("ddd, MMM Do YYYY");
        let withinTrip = true;
        let distStart = moment.duration(iDate.diff(startDate)).days();
        if (distStart < 0) withinTrip = false;
        let distEnd = moment.duration(iDate.diff(endDate)).days();
        if (distEnd > 0) withinTrip = false;
        if (withinTrip) {
            document.getElementById("week-day-pane-" + i.toString()).style.backgroundColor = '#bbdfbd';
            document.querySelector("#week-day-pane-" + i.toString() + " > div.event-add-button-wrap").style.display = 'initial';
        } else {
            document.getElementById("week-day-pane-" + i.toString()).style.backgroundColor = null;
            document.querySelector("#week-day-pane-" + i.toString() + " > div.event-add-button-wrap").style.display = 'none';
        }
    }
}

function changeDayDisplayOffset(direction) {
    if (direction == "left") {
        dayDisplayOffset -= 1;
    } else {
        dayDisplayOffset += 1;
    }
    loadDays();
    loadEvents();
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
});

var test_img = "http://r-ec.bstatic.com/xdata/images/hotel/square60/148085655.jpg?k=34e17d7d883196094efe05d1d73f8a60c5d6fee9c64ac2fba1987475d038631f&o="
var test_name = 'hi'
$('#travelModal').on('shown.bs.modal', function (e) {
    
    //make call to get the flight data from the backend
    flights

    var hotel_img = '<img src=' + test_img + '>';
    var name = '<p>'+ test_name +'</p>';
    var price = '<p>' + '266$' +'</p>';
    var flight_info = '<div class=flightContainer onClick=addFlight()>' + hotel_img + name + price + '</div>'

    var content = $(this).find('.container-fluid');
    content.append(flight_info);
    content.append(flight_info);
  })


  function addFlight(){
      
      // addEvent(flight start_day)
      // addEvent(flight end_day)
    
}

function loadEvents() {
    for (let i = 0; i < 7; i++) {
        document.getElementById(`week-${i}-events`).innerHTML = "";
    }
    for (let i = 0; i < 7; i++) {
        let iDate = moment(startDate);
        iDate = iDate.add(i, 'days').add(dayDisplayOffset, 'days');
        let index = moment.duration(iDate.diff(startDate)).days();
        let tripLength = moment.duration(endDate.diff(startDate)).days();
        if (index < 0 || index >= tripLength) {
            continue;
        }
        for (let j = 0; j < events[index].length; j++) {
            document.getElementById(`week-${i}-events`).innerHTML +=
            `<div class="event">
                <div class="event-title">${events[index][j].name}</div>
                <div class="event-cost">${events[index][j].cost}</div>
            </div>`;
        }
    }
}

function addEvent(eventPerson, eventItem, eventCost) {
    let i = nextEventDay;
    let iDate = moment(startDate);
    iDate = iDate.add(i, 'days').add(dayDisplayOffset, 'days');
    let index = moment.duration(iDate.diff(startDate)).days();
    let person = eventPerson;
    let name = eventItem;
    let c = eventCost;
    ws.send(JSON.stringify({type:'event', name: name, cost: c, day: index}));
    addBudgetItem(person, name, c);
    events[index].push({person: person, name: name, cost: c});
    document.getElementById(`week-${i}-events`).innerHTML +=
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
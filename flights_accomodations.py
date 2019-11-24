import http.client
import json


def get_flights(depart_date, return_date, depart_loc, arrive_loc):
    conn = http.client.HTTPSConnection("skyscanner-skyscanner-flight-search-v1.p.rapidapi.com")

    headers = {
        'x-rapidapi-host': "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
        'x-rapidapi-key': "988ea6ec2fmsh0f3000f19d710a2p154580jsn1ddc94e3585e"
        }

    depart_date = depart_date

    return_date = "?inboundpartialdate=" + return_date

    depart_location = depart_loc + "-sky"
    destination = arrive_loc + "-sky"
    request_url = "/apiservices/browseroutes/v1.0/CA/CAD/en-US" + "/" + depart_location + "/" + destination + "/" + depart_date + return_date

    # "/apiservices/browseroutes/v1.0/US/USD/en-US/JFK-sky/YYZ-sky/2019-12-10?inboundpartialdate=2019-12-14"
    conn.request("GET", request_url, headers=headers)

    res = conn.getresponse()
    data = res.read()
    test = data.decode("utf-8")
    main_dict = json.loads(test)

    flights_raw = main_dict['Quotes']
    airlines_raw = main_dict['Carriers']
    airlines_formatted = {}

    for airline in airlines_raw:
        id = airline['CarrierId']
        name = airline['Name']
        airlines_formatted[id] = name

    flights_formatted = []

    for flight in flights_raw:
        single_flight = {}
        single_flight["Price"] = flight['MinPrice']
        single_flight["Direct"] = flight['Direct']
        flight_id = flight['OutboundLeg']['CarrierIds'][0]
        single_flight["AirLine"] = airlines_formatted[flight_id]
        flights_formatted.append(single_flight)


    return flights_formatted


def get_accomodations(city_name, check_in, check_out, num_adults, num_rooms):
    conn = http.client.HTTPSConnection("apidojo-booking-v1.p.rapidapi.com")

    headers = {
        'x-rapidapi-host': "apidojo-booking-v1.p.rapidapi.com",
        'x-rapidapi-key': "988ea6ec2fmsh0f3000f19d710a2p154580jsn1ddc94e3585e"
    }

    ###### Getting the city_id based on the name

    city_name = city_name.replace(" ", "%20")

    city_request_url = "/locations/auto-complete?languagecode=en-us&text=" + city_name

    conn.request("GET", city_request_url, headers=headers)

    res = conn.getresponse()
    data = res.read()
    data = data.decode("utf-8")
    city_list = json.loads(data)

    city = city_list[0]
    city_id = str(city['dest_id'])
    city_type = city['dest_type']

    ##################### Using the city_id to search for accomodations

    hotel_request_url = "/properties/list?price_filter_currencycode=CAD&" \
                        "travel_purpose=leisure&search_id=none&order_by=popularity&" \
                        "languagecode=en-us&search_type=" + city_type \
                        + "&offset=0&dest_ids=" + city_id + "&guest_qty=" + \
                        str(num_adults) + "&arrival_date=" + check_in + \
                        "&departure_date=" + check_out + "&room_qty=" \
                        + str(num_rooms)

    conn.request("GET", hotel_request_url, headers=headers)

    res = conn.getresponse()
    data = res.read()
    data = data.decode("utf-8")
    hotels_raw = json.loads(data)
    hotels_raw = hotels_raw['result']

    hotel_list = []

    for hotel in hotels_raw:
        name = hotel['hotel_name_trans']
        try:
            photo_url = hotel['main_photo_url']
        except:
            photo_url = "https://cdn.galaxy.tf/thumb/sizeW1920/uploads/3s/cms_image/001/556/295/1556295051_5cc32d8b8938b-thumb.png"

        try:
            business_score = hotel['business_review_score']
        except:
            business_score = 6.0

        if business_score == 0:
            business_score = 'N/A'

        try:
            price = hotel['min_total_price']
        except:
            price = 0

        if price != 0:
            single_hotel = {
                'name': name,
                'photo': photo_url,
                'price': price,
                'avg review': business_score
            }
            hotel_list.append(single_hotel)

    print(hotel_list)

if __name__ == '__main__':

    print(get_flights( "2020-04-04", "2020-04-29",  "YYZ", "HNL"))
    print(get_accomodations('Toronto', "2019-12-14", "2019-12-17", 1, 1))

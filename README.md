# Travelo.io
Project made for Hack Western 6 Submission by Jack Liu, Jess Muir, Jennifer Chen

Travel.io is a web app that allows users to collaborate with their travel mates to make the planning process as smooth-sailing as possible.
The web app aggregates flight and accommodation details for the user's destination of choice. The users are able to plan out events that fit every individual's schedule, and track their spending on the trip. Additionally, users are able to see a breakdown of who owes whom how much.


## Getting Started

To run the application, download repository and run ```main.py``` and go to ```http://localhost:5000/``` in a web browser to enter the workspace. 

To have another user in the workspace, open another tab to ```http://localhost:5000/``` and use a different username. When entering availabilty make sure to enter only future dates into the calendar


## Notes

You will need Flask installed to run application, originally built with Flask version 1.1.1

During original hackathon submission, application was hosted on Google Cloud Platform for demo but server is no longer active. To currently see application and multiple user features application must be locally hosted.

Calendar displays days in green for when all users are available for those dates, otherwise no events can be scheduled.


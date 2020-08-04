import * as React from 'react';
import { IEventsWithLocationProps } from './IEventsWithLocationProps';
import { IEventsWithLocationState } from './IEventsWithLocationState';
import { sp } from "@pnp/sp";
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { Modal, IconButton, PrimaryButton, IButtonProps } from 'office-ui-fabric-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import * as moment from 'moment';
import { GetEventOrgName, GetEventOrgEmail, GetGroupDetails, UpdateUserEventStatus, CurrentUserId, sendEmailForEvent, addCalendarEvent, CheckIfUserExists, CurrentUserEmail, GetUserDetails, CurrentUserDisplayName } from './Common';
require('../Externals/Styles.css');

let data = [];
let mailTitle = "";
let mailDesc = "";

export default class EventsWithLocation extends React.Component<IEventsWithLocationProps, IEventsWithLocationState> {


  // STATE INITIALIZATION

  public constructor(props: IEventsWithLocationProps, state: IEventsWithLocationState) {

    super(props);

    sp.setup({
      sp: {
        baseUrl: this.props.siteUrl
      },
    });

    // STATE INITIALIZATION

    this.state = {
      ListData: [],
      IsLoaded: false,
      hideModal: false,
      eventTitle: "",
      eventLocation: "",
      eventStartDate: "",
      eventEndDate: "",
      eventDescription: "",
      eventAttendees: "",
      goingCount: 0,
      maybeCount: 0,
      cantGoCount: 0,
      eventUserId: 0,
      CurrentUserID: 0,
      ItemId: 0,
      IfUserExist: false,
      maps: "",
      eventCategory: "",
      EventMeetingSpace: "",
      ValidEventContributor: false,
      CurrentUserEmail: "",
      CurrentUserDisplayName: "",
      Call: "",
      RecurrenceEvent: "",
      EventOrganizer: "",
      EventOrganizerName: ""
    };
    initializeIcons(this.props.siteUrl);
  }


  public async componentDidMount() {
    let votingTrackerName = "";
    let results = await sp.web.lists.getByTitle("EventsCustomsList").items.get();
    if (results.length != 0) {
      let stateData = results;
      for (let i = 0; i < stateData.length; i++) {
        let color = "";
        if (stateData[i].Location == "Elkridge, MD") {
          color = "#E10098";
        } else if (stateData[i].Location == "Windsor Mill, MD") {
          color = "#0071B9";
        } else if (stateData[i].Location == "West Des Moines, IA") {
          color = "#E1E000";
        } else if (stateData[i].Location == "Other") {
          color = "#5B6770";
        }
        /* let grpNames = await GetGroupDetails(stateData[i].EventAttendeesId);
        if (stateData[i].VotingTrackerPersonId != null || stateData[i].VotingTrackerPersonId != undefined) {
          votingTrackerName = await GetUserDetails(stateData[i].VotingTrackerPersonId);
        } */

        let eventOrgEmail = await GetEventOrgEmail(stateData[i].EventOrganizerId)
        let eventOrgName = await GetEventOrgName(stateData[i].EventOrganizerId)

        // moment().isUtcOffset();
        let strDate = new Date(stateData[i].StartDateAndTime).toLocaleString("en-US", { timeZone: "America/New_York" });
        let endDate = new Date(stateData[i].EndDateAndTime).toLocaleString("en-US", { timeZone: "America/New_York" });
        let startDate = new Date(strDate);
        let endingDate = new Date(endDate);
        startDate.setHours(startDate.getHours() - 3);
        endingDate.setHours(endingDate.getHours() - 3);
        let value = {
          "title": stateData[i].Title,
          "start": startDate,
          "end": endingDate,
          "color": color,
          extendedProps: {
            "description": stateData[i].EventDescription,
            "location": stateData[i].Location,
            // "attendees": grpNames,
            // "goingCount": stateData[i].GoingCount,
            // "mayBeCount": stateData[i].MayBeCount,
            // "CantGoCount": stateData[i].CantGoCount,
            // "userId": stateData[i].VotingTrackerPersonId,
            "itemId": stateData[i].ID,
            // "listOfUserIDs": stateData[i].VotingTrackerPersonId,
            // "maps": stateData[i].GoogleMaps,
            "category": stateData[i].Category,
            "MeetingSpace": stateData[i].MeetingSpace,
            // "call": stateData[i].Call.Url,
            "reccurrenceEvent": stateData[i].EventRecurrence,
            // "personList": votingTrackerName
            "eventOrgEmail": "mailto:" + eventOrgEmail,
            "eventOrgName": eventOrgName
          }
        };
        data.push(value);
      }
      let userId = await CurrentUserId();
      let userEmail = await CurrentUserEmail();
      let userDisplayName = await CurrentUserDisplayName();
      userEmail = userEmail;
      /* let ifUserExistsinSPGroup = await CheckIfUserExists(userId);
      let EventContributorStatus = false;
      if (ifUserExistsinSPGroup > 0) {
        EventContributorStatus = true;
      } */
      this.setState({ IsLoaded: true, CurrentUserID: userId, CurrentUserEmail: userEmail, CurrentUserDisplayName: userDisplayName });
    } else {
      this.setState({ IsLoaded: true });
    }
  }

  public handleEventClick(event) {

    // let enableRSVP = true;

    var formattedStartDate = this.formateDate(event.event.start);
    var formattedEndDate = this.formateDate(event.event.end);
    // let currDispName = this.state.CurrentUserDisplayName;

    // let currUserIdCheck = event.event.extendedProps.personList;
    // let isUserExist = currUserIdCheck.includes(this.state.CurrentUserID);
    /*if (isUserExist == false && this.state.ValidEventContributor == true) {
      enableRSVP = false;
    } */

    /* 
    CheckIfUserExists(this.state.CurrentUserID, event.event.extendedProps.attendees)
      .then((res) => {
        // res --> valid contributor

        let isUserExist = false;
        if (event.event.extendedProps.personList == "") {
          isUserExist = false;
        } else {
          console.log(event.event.extendedProps.personList);
          let isMulti = (event.event.extendedProps.personList).includes(";");
          if (isMulti == false) {
            if (event.event.extendedProps.personList == currDispName) {
              isUserExist = true;
            }
          } else {
            let grpArr = (event.event.extendedProps.personList).split(";");
            for (let i = 0; i < grpArr.length; i++) {
              if (grpArr[i] == this.state.CurrentUserDisplayName) {
                isUserExist = true;
              }
              if (isUserExist == true) {
                break;
              }
            }
          }
        }
        let reactHandler = this;
        reactHandler.setState({
          eventTitle: event.event.title,
          eventStartDate: formattedStartDate,
          eventEndDate: formattedEndDate,
          eventAttendees: event.event.extendedProps.attendees,
          eventDescription: event.event.extendedProps.description,
          eventLocation: event.event.extendedProps.location,
          goingCount: event.event.extendedProps.goingCount,
          cantGoCount: event.event.extendedProps.CantGoCount,
          maybeCount: event.event.extendedProps.mayBeCount,
          eventUserId: event.event.extendedProps.listOfUserIDs,
          ItemId: event.event.extendedProps.itemId,
          maps: event.event.extendedProps.maps,
          IfUserExist: isUserExist,
          eventCategory: event.event.extendedProps.category,
          EventMeetingSpace: event.event.extendedProps.MeetingSpace,
          Call: event.event.extendedProps.call,
          RecurrenceEvent: event.event.extendedProps.reccurrenceEvent
        });
        this.toggle();
      });

      */

    let reactHandler = this;
    reactHandler.setState({
      eventTitle: event.event.title,
      eventStartDate: formattedStartDate,
      eventEndDate: formattedEndDate,
      //eventAttendees: event.event.extendedProps.attendees,
      eventDescription: event.event.extendedProps.description,
      eventLocation: event.event.extendedProps.location,
      // goingCount: event.event.extendedProps.goingCount,
      // cantGoCount: event.event.extendedProps.CantGoCount,
      // maybeCount: event.event.extendedProps.mayBeCount,
      // eventUserId: event.event.extendedProps.listOfUserIDs,
      ItemId: event.event.extendedProps.itemId,
      // maps: event.event.extendedProps.maps,
      // IfUserExist: isUserExist,
      eventCategory: event.event.extendedProps.category,
      EventMeetingSpace: event.event.extendedProps.MeetingSpace,
      // Call: event.event.extendedProps.call,
      RecurrenceEvent: event.event.extendedProps.reccurrenceEvent,
      EventOrganizer: event.event.extendedProps.eventOrgEmail,
      EventOrganizerName: event.event.extendedProps.eventOrgName

    });
    this.toggle();

  }

  public toggle() {
    let reactHandler = this;
    reactHandler.setState({ hideModal: true });
  }

  public formateDate(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
  }

  public _closeModal() {
    this.setState({ hideModal: false });
  }

  /* public async UpdateStatusCount(event: any) {
    this.setState({ IsLoaded: false });
    let userList = [];
    let userIfExist = false;
    var currUserId = event.target.dataset.id;
    if (event.target.dataset.id == null || event.target.dataset.id == undefined) {
      currUserId = "";
    }
    let isMulti = currUserId.includes(",");
    if (isMulti == true) {
      currUserId = currUserId.split(',').map(x => +x);
      currUserId.push(this.state.CurrentUserID);
    } else if (currUserId == "") {
      userList.push(this.state.CurrentUserID);
    } else {
      userList.push(Number(currUserId));
      userList.push(this.state.CurrentUserID);
    }
    let ItemId = Number(event.target.dataset.itemid);
    let text = event.target.dataset.text;
    if (currUserId == "") {
      await UpdateUserEventStatus(userList, text, ItemId, userIfExist);
    } else if (isMulti == false && userList.length == 2) {
      await UpdateUserEventStatus(userList, text, ItemId, userIfExist);
    } else {
      await UpdateUserEventStatus(currUserId, text, ItemId, userIfExist);
    }
    console.log("Status updated");
    window.location.reload();
  } */

  public async sendEmail() {
    mailTitle = this.state.eventTitle;
    mailDesc = this.state.eventDescription;
    await sendEmailForEvent(mailTitle, mailDesc);
    alert("email sent successfuly");
  }

  public async addEventCalendar() {
    await addCalendarEvent(this.state.eventTitle, this.state.eventDescription, this.state.eventStartDate, this.state.eventEndDate, this.state.eventLocation, this.state.RecurrenceEvent);
  }

  public render(): React.ReactElement<IEventsWithLocationProps> {
    if (this.state.IsLoaded === false) {
      return (
        <div> Component Loading . . . </div>
      );
    } else {
      return (
        <div>
          <FullCalendar
            defaultView="dayGridMonth"
            //timeZone="local"
            plugins={[dayGridPlugin, timeGridPlugin]}
            weekends={false}
            events={data}
            eventClick={this.handleEventClick.bind(this)}
            header={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
          />
          <Modal isOpen={this.state.hideModal} onDismiss={this._closeModal} >
            <div style={{ textAlign: "right" }}><IconButton iconProps={{ iconName: 'Cancel' }} ariaLabel="Close" onClick={this._closeModal.bind(this)} /> </div>
            <div className="modal_wrap" style={{ width: 800, marginLeft: 10, marginRight: 10 }}>
              
              <div className="modal_body">
                <div className="content_wrap">
                  <div>
                    <div>
                      <strong>Time:</strong>
                    </div>
                    <div>
                      {this.state.eventStartDate} - {this.state.eventEndDate}
                    </div>
                  </div>
                  <div>
                    <div>
                      <strong>Location:</strong>
                    </div>
                    <div>
                      {this.state.eventLocation}
                    </div>
                  </div>
                  <div>
                    <div>
                      <strong>Category:</strong>
                    </div>
                    <div>
                      {this.state.eventCategory}
                    </div>
                  </div>
                  <div>
                    <div>
                      <strong>Meeting Space:</strong>
                    </div>
                    <div>
                      {this.state.EventMeetingSpace}
                    </div>
                  </div>
                  {/* <div>
                    <div>
                      <strong>Call URL:</strong>
                    </div>
                    <div>
                      <a href={this.state.Call}>{this.state.Call}</a>
                    </div>
                  </div> */}
                  <div>
                    <div>
                      <strong>Description:</strong>
                    </div>
                    <div>
                      {this.state.eventDescription}
                    </div>
                  </div>
                  <div>
                    <div>
                      <strong>Event Organizer:</strong>
                    </div>
                    <div>
                      {this.state.EventOrganizerName}
                    </div>
                  </div>
                  
                  {/* <div>
                    <div>
                      <strong>Attendees:</strong>
                    </div>
                    <div>
                      {this.state.eventAttendees}
                    </div>
                  </div> */}
                </div>
                {/* <div className="attendees_count_wrap">
                  <div className={`attendees_going ${this.state.IfUserExist ? "attendees_disabled" : ""}`}>
                    <div >
                      {this.state.goingCount}
                    </div>
                    <div >
                      <button onClick={this.UpdateStatusCount.bind(this)} data-id={this.state.eventUserId} data-itemid={this.state.ItemId} data-text="Going" disabled={this.state.IfUserExist} style={{ backgroundColor: "#8ad157", color: "white", border: "none", width: 120, height: 50 }}>Going</button>
                    </div>
                  </div>
                  <div className={`attendees_maybe ${this.state.IfUserExist ? "attendees_disabled" : ""}`}>
                    <div>
                      {this.state.maybeCount}
                    </div>
                    <div >
                      <button onClick={this.UpdateStatusCount.bind(this)} data-id={this.state.eventUserId} data-itemid={this.state.ItemId} data-text="MayBe" disabled={this.state.IfUserExist} style={{ backgroundColor: "#37474f", color: "white", border: "none", width: 120, height: 50 }} >Maybe</button>
                    </div>
                  </div>
                  <div className={`attendees_notgoing ${this.state.IfUserExist ? "attendees_disabled" : ""}`}>
                    <div>
                      {this.state.cantGoCount}
                    </div>
                    <div >
                      <button onClick={this.UpdateStatusCount.bind(this)} data-id={this.state.eventUserId} data-itemid={this.state.ItemId} data-text="CantGo" disabled={this.state.IfUserExist} style={{ backgroundColor: "#a9026d", color: "white", border: "none", width: 120, height: 50 }} >Can't Go </button>
                    </div>
                  </div>
                </div> */}
                <div className="user_details">
                  <div>

                    {/* <a href="javascript:void(0)" className="user_email" onClick={this.sendEmail.bind(this)}> */}
                    <a href={this.state.EventOrganizer} className="user_email" >
                      <img src="https://newwavetechnologies.sharepoint.com/SiteAssets/images/All%20Images/Mail.png" />
                      <span>Email</span>
                    </a>
                  </div>
                  {/* <div>
                    <a href="javascript:void(0)" className="user_mail_to" onClick={this.addEventCalendar.bind(this)} >
                      <img src="https://newwavetechnologies.sharepoint.com/SiteAssets/images/All%20Images/Calendar.png" />
                      <span>Add Event</span>
                    </a>
                  </div> */}
                  {/* <div className="user_map" >
                    <a href={this.state.maps} target="_blank" className="user_mail_to" >
                      <img src="https://newwavetechnologies.sharepoint.com/SiteAssets/images/All%20Images/Maps.png" />
                      <span>Google Maps</span>
                    </a>
                  </div> */}
                </div>
              </div>
              <div >
                <h2 style={{ textAlign: "center" }}>{this.state.eventTitle}</h2>
              </div>
            </div>
          </Modal>
        </div>
      );
    }
  }
}

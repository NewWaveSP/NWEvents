import { sp } from "@pnp/sp";
import { CurrentUser } from '@pnp/sp/src/siteusers';
import { EmailProperties } from "@pnp/sp";
import { ApplicationCustomizerContext } from "@microsoft/sp-application-base";
import { SPComponentLoader } from "@microsoft/sp-loader";
import { constrainPoint } from "@fullcalendar/core";

SPComponentLoader.loadScript("https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js");
declare var $;

async function GetGroupDetails(id) {
    let grpDetails = "";
    if (id.length === 1) {
        let userId: number = id[0];
        // await sp.web.siteUsers.getById(userId).get().then( (userInfo) => { userDetails = userInfo.Title; }).catch( (e) => {  console.log("Group / User not found "); });
        await sp.web.siteGroups.getById(id).get()
            .then((e) => {
                grpDetails = e.Title;
            })
            .catch((e) => {
                console.log("Group / User not found ");
            });

    } else {
        for (let i = 0; i < id.length; i++) {
            let userId: number = id[i];
            // await sp.web.siteUsers.getById(userId).get().then( (userInfo) => { userDetails += userInfo.Title + ";"; }).catch( (e) => {  console.log("Group / User not found "); });
            await sp.web.siteGroups.getById(id).get()
                .then((e) => {
                    grpDetails += e.Title + ";";
                })
                .catch((e) => {
                    console.log("Group / User not found ");
                });
        }
    }
    return grpDetails;
}

async function GetUserDetails(id) {
    let usrDetails = "";
    if (id.length === 1) {
        let userId: number = id[0];
        await sp.web.siteUsers.getById(userId).get().then((userInfo) => { usrDetails = userInfo.Title; }).catch((e) => { console.log("Group / User not found "); });
        // let grp = await sp.web.siteGroups.getById(id).get();
    } else {
        for (let i = 0; i < id.length; i++) {
            let userId: number = id[i];
            await sp.web.siteUsers.getById(userId).get().then((userInfo) => { usrDetails += userInfo.Title + ";"; }).catch((e) => { console.log("Group / User not found "); });
            // let usr = await sp.web.siteGroups.getById(id).get();
            // usrDetails += usr.Title+";";
        }
    }
    return usrDetails;
}

async function GetEventOrgEmail(id){
    let usrEmail = "";
    await sp.web.siteUsers.getById(id).get().then((userInfo) => { usrEmail = userInfo.Email; }).catch((e) => { console.log("Group / User not found "); });
    return usrEmail;
}

async function GetEventOrgName(id){
    let usrEmail = "";
    await sp.web.siteUsers.getById(id).get().then((userInfo) => { usrEmail = userInfo.Title; }).catch((e) => { console.log("Group / User not found "); });
    return usrEmail;
}

async function sendEmailForEvent(mailTitle, mailDesc) {
    let email = "";
    let r = await sp.web.currentUser.get();
    email = r['UserPrincipalName'];
    const emailProps: EmailProperties = {
        To: [email],
        Subject: "Regarding : " + mailTitle,
        Body: mailDesc,
    };
    await sp.utility.sendEmail(emailProps);
}

async function CurrentUserId() {
    let r = await sp.web.currentUser.get();
    return r['Id'];
}

async function CurrentUserEmail() {
    let r = await sp.web.currentUser.get();
    return r['Email'];
}

async function CurrentUserDisplayName() {
    let r = await sp.web.currentUser.get();
    return r['Title'];
}

async function UpdateUserEventStatus(currUserId, eventUserStatus, itemId, userIfExist) {
    let metadata: any;
    let resultExistingCount = await getExistingCountitemId(itemId, eventUserStatus);
    resultExistingCount = resultExistingCount + 1;
    if (eventUserStatus === "Going") {
        metadata = { "VotingTrackerPersonId": { results: currUserId }, "GoingCount": resultExistingCount };
    } else if (eventUserStatus === "MayBe") {
        metadata = { "VotingTrackerPersonId": { results: currUserId }, "MayBeCount": resultExistingCount };
    } else if (eventUserStatus === "CantGo") {
        metadata = { "VotingTrackerPersonId": { results: currUserId }, "CantGoCount": resultExistingCount };
    }
    await sp.web.lists.getByTitle("EventsCustomsList").items.getById(itemId).update(metadata);
}

async function getExistingCountitemId(itemId, eventUserStatus) {
    let resultCount = 0;
    let existinDataCount = await sp.web.lists.getByTitle("EventsCustomsList").items.select("GoingCount", "MayBeCount", "CantGoCount").getById(itemId).get();
    if (eventUserStatus === "Going") {
        resultCount = existinDataCount.GoingCount;
    } else if (eventUserStatus === "MayBe") {
        resultCount = existinDataCount.MayBeCount;
    } else if (eventUserStatus === "CantGo") {
        resultCount = existinDataCount.CantGoCount;
    }
    return resultCount;
}

async function addCalendarEvent(eventTitle, eventDescription, eventStartDate, eventEndDate, eventLocation, eventRecurrence) {
    var dataTemplate = "{\r\n    \"eventTitle\": \"" + eventTitle + "\",\r\n    \"eventDescription\": \"" + eventDescription + "\",\r\n    \"eventStart\": \"" + eventStartDate + "\",\r\n    \"eventEnd\": \"" + eventEndDate + "\"    ,\r\n    \"eventLocation\": \"" + eventLocation + "\",\r\n    \"eventRecurrence\": \"" + eventRecurrence + "\"   \r\n  }";
    let URL = "https://prod-04.westus.logic.azure.com:443/workflows/22ff4dd4f5a44bef974943e9338ce0ac/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ZUDPrNwxSHUhQeuKOOCUz6d7mq-F4Y-wjZl4NxDUL6s";
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": URL,
        "method": "POST",
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-cache"
        },
        "processData": false,
        "data": dataTemplate
    };
    $.ajax(settings).done((response) => {
        console.log(response);
    }).done((response) => {
        alert("Event Added. ");
    });
}

async function CheckIfUserExists(userId, eventGroups) {
    let isMulti = eventGroups.includes(";");
    if (isMulti == true) {
        let isExist = false;
        let grpArr = eventGroups.split(";");
        for (let i = 0; i < grpArr.length; i++) {
            let res = await sp.web.siteGroups.getByName(grpArr[i]).users.filter("ID eq " + userId + "").get();
            if (res.length > 0) {
                isExist = true;
                break;
            }
        }
        if (isExist == true) {
            return true;
        } else {
            return false;
        }
    } else {
        let res = await sp.web.siteGroups.getByName(eventGroups).users.filter("ID eq " + userId + "").get();
        if (res.length > 0) {
            return true;
        } else {
            return false;
        }
    }
    // await sp.web.siteGroups.getByName('Events RSVP users').users.filter("ID eq "+userId+"").get(); return res.length; 
}

export {GetEventOrgName, GetEventOrgEmail, GetGroupDetails, UpdateUserEventStatus, CurrentUserId, sendEmailForEvent, addCalendarEvent, CheckIfUserExists, CurrentUserEmail, GetUserDetails, CurrentUserDisplayName };

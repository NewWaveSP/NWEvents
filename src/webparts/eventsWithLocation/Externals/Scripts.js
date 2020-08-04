document.addEventListener('DOMContentLoaded', function () {
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
      plugins: ['interaction', 'dayGrid', 'timeGrid'],
      defaultView: 'dayGridMonth',
      defaultDate: '2019-11-07',
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      eventClick: function (info) {
        info.jsEvent.preventDefault();
        //eventObj contains the event data
        var eventObj = info.event;

        $("#eventDesc").modal("show")
      },
      events: [{
          title: 'All Day Event',
          start: '2019-11-01',
          end: '2019-11-01',
          color: 'green',
          textColor: '#fff'
        },
        {
          title: 'All Day Event2',
          start: '2019-11-01',
          end: '2019-11-01',
          color: 'red',
          textColor: '#000'
        },
        {
          title: 'All Day Event3',
          start: '2019-11-11',
          end: '2019-11-11',
          color: '#000',
          textColor: '#fff'
        }
      ]
    });
    calendar.render();
  });
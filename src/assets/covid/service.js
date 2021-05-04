setTimeout(function () {
  self.registration.showNotification("Subscribed to slots updates", {
    body: "You will receive a notification when there are slots available.",
    image: "https://assets.sembark.com/images/logos/logo_96x96.png",
  });
}, 1000);

let timer;

function scheduleSlotsAvailability(after) {
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(function () {
    checkForSlotsAvailability();
  }, after);
}

scheduleSlotsAvailability(1000);

function checkForSlotsAvailability() {
  clearTimeout(timer);
  return getSubscriptions().then((subscriptions) => {
    subscriptions.map(function (sub) {
      const query = JSON.parse(sub.id);
      if (query.pincode || query.district_id) {
        fetchSessions(query)
          .then((sessions) => {
            if (sessions.length) {
              console.log("Slots available at " + new Date());
              // some sessions are available
              notify(
                `${sessions.reduce(
                  (total, s) => total + s.available_capacity,
                  0
                )} Vaccination Slots Available for ${query.minAgeLimit}+`,
                {
                  body: `${sessions.length} centers in ${sessions[0].district_name} (${sessions[0].pincode})`,
                  actions: [
                    {
                      action: "view",
                      title: "View",
                    },
                    {
                      action: "unsubscribe",
                      title: "Unsubscribe",
                    },
                  ],
                  tag: sub.id,
                  image:
                    "https://assets.sembark.com/images/logos/logo_96x96.png",
                  data: {
                    link: `/covid/vaccination-slots-availability/?${
                      query.pincode ? `pincode=${query.pincode}` : ``
                    }${
                      query.district_id
                        ? `district_id=${query.district_id}`
                        : ``
                    }&minAgeLimit=45`,
                  },
                }
              );
            } else {
              console.log("No slots available till " + new Date());
              console.log("Rescheduling availability check...");
              // no slots available
              // after 30 minutes
              scheduleSlotsAvailability(1000 * 60 * 1);
            }
          })
          .catch(function (e) {
            console.error(e);
          });
      }
    });
  });
}

self.addEventListener("notificationclick", function (event) {
  console.log("On notification click: ", event.notification);
  const link = event.notification.data
    ? event.notification.data.link
    : "/covid/vaccination-slots-availability";
  event.notification.close();
  if (!link || !event.action) return;

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
      })
      .then(function (clientList) {
        console.log(clientList);
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url == link && "focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(link || "/");
      })
  );

  switch (event.action) {
    case "view":
      clearTimeout(timer);
      // there were some slots available, client clicked on view
      // reschedule the check
      console.log(
        "Notification clicked on view. Rescheduling slots availability check"
      );
      // after 30 minutes
      scheduleSlotsAvailability(1000 * 60 * 1);
      break;
    case "unsubscribe":
      removeAllSubscriptions();
      self.registration.unregister();
      console.log("unsubscribe from this");
      break;
  }
});

self.addEventListener("notificationclose", function (event) {
  console.log("On notification close: ", event.notification);
  if (!event.notification.actions.length) return;
  // there were some slots available, client closed the notification without any action
  // re-register a call to check for availability
  // after 30 minutes
  scheduleSlotsAvailability(1000 * 60 * 1);
});

function notify(title, options) {
  if (self.registration.active) {
    self.registration.showNotification(title, options);
  }
}

function fetchSessions(query) {
  const today = new Date();
  return Promise.all(
    [today].map(function fetchSlotsToDate(date) {
      let url;
      if (query.pincode) {
        url =
          "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin" +
          "?pincode=" +
          encodeURIComponent(query.pincode);
      } else {
        url =
          "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict" +
          "?district_id=" +
          encodeURIComponent(query.district_id);
      }
      return fetch(url + "&date=" + formatDate(new Date()), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then(function (resp) {
          return resp.json();
        })
        .then(function (data) {
          if (data.error) {
            throw new Error(data.error);
          }
          const centers = data.centers;
          const sessions = centers.reduce(function (sessions, center) {
            return sessions.concat(
              center.sessions.map(function (session) {
                session = Object.assign({}, session, center);
                delete session["sessions"];
                return session;
              })
            );
          }, []);
          return sessions;
        });
    })
  )
    .then(function (arrayOfArrayOfSessions) {
      return arrayOfArrayOfSessions.reduce(function flattenSessions(
        sessions,
        arrayOfSessions
      ) {
        return sessions.concat(arrayOfSessions);
      },
      []);
    })
    .then(function (sessions) {
      return sessions.filter(function hasAvailableSlots(session) {
        if (parseInt(session.available_capacity) <= 0) {
          return false;
        }
        const minAgeLimit = parseInt(query.minAgeLimit);
        if (Number(session.min_age_limit) > minAgeLimit) {
          return false;
        }
        return true;
      });
    });
}

function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [day, month, year].join("-");
}

function getSubscriptions() {
  return new Promise((resolve, reject) => {
    let db;
    const request = self.indexedDB.open("covid", 1);
    request.onsuccess = function () {
      db = request.result;
      let transaction = db.transaction("subscriptions");
      let subscriptions = transaction.objectStore("subscriptions");
      const fetchRequest = subscriptions.getAll();
      fetchRequest.onsuccess = function () {
        if (!fetchRequest.result) {
          return reject("No subscriptions");
        }
        resolve(fetchRequest.result);
      };
    };
    // create/upgrade the database without version checks
    request.onupgradeneeded = function () {
      let db = request.result;
      if (!db.objectStoreNames.contains("subscriptions")) {
        // if there's no "books" store
        db.createObjectStore("subscriptions", { keyPath: "id" }); // create it
      }
    };
  });
}

function removeAllSubscriptions() {
  return new Promise((resolve) => {
    let db;
    const request = self.indexedDB.open("covid", 1);
    request.onsuccess = function () {
      db = request.result;
      let transaction = db.transaction("subscriptions", "readwrite");
      let subscriptions = transaction.objectStore("subscriptions");
      const req = subscriptions.clear();
      req.onsuccess = function () {
        resolve();
      };
    };
    // create/upgrade the database without version checks
    request.onupgradeneeded = function () {
      let db = request.result;
      if (!db.objectStoreNames.contains("subscriptions")) {
        // if there's no "books" store
        db.createObjectStore("subscriptions", { keyPath: "id" }); // create it
      }
    };
  });
}

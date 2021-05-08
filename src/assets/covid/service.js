importScripts("https://unpkg.com/idb@6.0.0/build/iife/index-min.js");

let gcid = `GA1.2.${parseInt(Math.random() * 1000000000)}${parseInt(
  Math.random() * 1000000000
)}`;

let timer;
function scheduleSlotsAvailability(after) {
  console.log(
    `[Scheduled (${new Date()})]: Check for slots availability after ${
      after / (1000 * 60)
    } minutes`
  );
  if (timer) {
    clearTimeout(timer);
  }
  timer = setTimeout(function () {
    timer = undefined;
    // stop the availability check if there are no subscriptions left
    getSubscriptionsLength().then(function (count) {
      if (count > 0) {
        checkForSlotsAvailability().then(() => {
          // retry after 5 minutes
          scheduleSlotsAvailability(1000 * 60 * 5);
        });
      }
    });
  }, after);
}

self.addEventListener("activate", function (evt) {
  getSubscriptionsLength().then((count) => {
    if (count > 0) {
      scheduleSlotsAvailability(5000);
    }
  });
});

// Receive the messages
self.addEventListener("message", (event) => {
  switch (event.data.type) {
    case "gcid":
      gcid = event.data.payload;
      break;
    case "check_availability_if_subscribed":
      getSubscriptionsLength().then((count) => {
        if (count > 0 && !timer) {
          scheduleSlotsAvailability(100);
        }
      });
      break;
    case "subscribe":
      saveSubscription(event.data.payload);
      scheduleSlotsAvailability(5000);
      notify("Subscribed to slots updates", {
        body:
          "You will receive notification(s) for slots availability in this area.",
        tag: "subscribed",
      });
      break;
    case "unsubscribe":
      deleteSubscription(event.data.payload);
      getSubscriptions().then(function (subscriptions) {
        event.source.postMessage({
          type: "subscriptions",
          payload: subscriptions,
        });
      });
      break;
    case "unsubscribe_all":
      removeAllSubscriptions();
      scheduleSlotsAvailability(0);
      break;
    case "get_subscriptions":
      getSubscriptions().then(function (subscriptions) {
        event.source.postMessage({
          type: "subscriptions",
          payload: subscriptions,
        });
      });
      break;
    case "get_subscription_details":
      getSubscriptionDetails(event.data.payload).then(function (details) {
        event.source.postMessage({
          type: "subscription_details",
          payload: details,
        });
      });
      break;
    case "get_availability_stats":
      getAvailabilityStatsForQuery(event.data.payload).then(function (details) {
        event.source.postMessage({
          type: "availability_stats",
          payload: details,
        });
      });
      break;
  }
});

async function checkForSlotsAvailability() {
  console.log(`[${new Date()}]: Checking for slots availability...`);
  return await getSubscriptions().then((subscriptions) => {
    return Promise.all([
      subscriptions.map(function (sub) {
        const query = JSON.parse(sub.id);
        if (query.pincode || query.district_id) {
          fetchSessions(query)
            .then((sessions) => {
              if (sessions.length) {
                console.log(`[${new Date()}]: Slots available at for `, query);
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
                    data: {
                      link: `${
                        location.origin
                      }/covid/vaccination-slots-availability/?${
                        query.pincode ? `pincode=${query.pincode}` : ``
                      }${
                        query.district_id
                          ? `district_id=${query.district_id}`
                          : ``
                      }&minAgeLimit=45&viaNotification=1`,
                    },
                  }
                );
              } else {
                // no slots available
                console.log(`[${new Date()}]: No slots available`);
              }
            })
            .catch(function (e) {
              // Something went wrong
              notify("Failed to refresh vaccination slots availability", {
                body: `Error: ${
                  e.message || "Network Issue"
                }. Please check that you have a working internet connection.`,
                tag: "error",
                actions: [
                  {
                    action: "retry_now",
                    title: "Retry Now",
                  },
                  {
                    action: "unsubscribe",
                    title: "Unsubscribe",
                  },
                ],
              });
            });
        }
      }),
    ]);
  });
}

self.addEventListener("notificationclick", function (event) {
  console.log("On notification click: ", event.notification);
  const link = event.notification.data
    ? event.notification.data.link
    : undefined;
  event.notification.close();
  if (!link || !event.notification.actions.length) return;

  event.waitUntil(openOrFocusLink(link));
  switch (event.action) {
    case "unsubscribe":
      console.log("unsubscribe from " + event.notification.tag);
      deleteSubscription(event.notification.tag);
      reportToGA("covid_notification_clicked", "unsubscribe");
      break;
    case "retry_now":
      // there were some slots available, client clicked on view / simply  the notification
      // reschedule the check
      console.log("Retry now, Refresh the slots availability");
      event.waitUntil(openOrFocusLink(link));
      reportToGA("covid_notification_clicked", "retry_now");
      scheduleSlotsAvailability(1000);
      break;
    default:
      // there were some slots available, client clicked on view / simply  the notification
      // reschedule the check
      console.log(
        "Notification clicked. Rescheduling slots availability check"
      );
      reportToGA("covid_notification_clicked", "view_or_others");
      break;
  }
});

self.addEventListener("notificationclose", function (event) {
  console.log("On notification close: ", event.notification);
  reportToGA("covid_notification_closed", event.notification.title);
  // if (!event.notification.actions.length) return;
});

function notify(title, options) {
  if (self.registration.active) {
    reportToGA("covid_notification_shown", title);
    self.registration.showNotification(
      title,
      Object.assign({}, options, {
        icon: "https://assets.sembark.com/images/logos/logo_96x96.png",
      })
    );
  }
}

async function fetchSessions(query) {
  const today = new Date();
  return Promise.all(
    [today].map(async function fetchSlotsToDate(date) {
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
      return fetch(url + "&date=" + formatDate(date), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        referrer: "",
        referrerPolicy: "same-origin",
        mode: "cors",
        keepalive: true,
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
      const sessionsAfterOtherFiltersApplied = sessions.filter(
        function hasAvailableSlots(session) {
          const minAgeLimit = parseInt(query.minAgeLimit);
          if (Number(session.min_age_limit) !== minAgeLimit) {
            return false;
          }
          return true;
        }
      );
      storeAvailabilityStatsForQuery(query, sessionsAfterOtherFiltersApplied);
      return sessionsAfterOtherFiltersApplied.filter(function hasAvailableSlots(
        session
      ) {
        if (parseInt(session.available_capacity) <= 0) {
          return false;
        }
        return true;
      });
    });
}

async function saveSubscription(query) {
  const db = await getDB();
  return await db.add("subscriptions", { id: query });
}

async function deleteSubscription(query) {
  const db = await getDB();
  return await db.delete("subscriptions", query);
}

async function getSubscriptionsLength() {
  const db = await getDB();
  return await db.count("subscriptions");
}

async function getSubscriptions() {
  const db = await getDB();
  return await db.getAll("subscriptions");
}

async function getSubscriptionDetails(subscription) {
  const db = await getDB();
  try {
    return await db.get("subscriptions", subscription);
  } catch (e) {
    return Promise.resolve();
  }
}

async function removeAllSubscriptions() {
  let db = await getDB();
  return await db.clear("subscriptions");
}

async function storeAvailabilityStatsForQuery(query, sessions) {
  if (typeof query !== "string") {
    query = JSON.stringify(query);
  }
  if (sessions.length === 0) return Promise.resolve([]);
  let totalAvailability = sessions.reduce(
    (total, s) => total + Number(s.available_capacity),
    0
  );
  const db = await getDB();
  const existingAvailabilityStats = await db.getAllFromIndex(
    "availability",
    "query_idx",
    query
  );
  const now = new Date();
  now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5);
  const at = getTimeString(now);
  const existing = existingAvailabilityStats.find((s) => s.at === at);
  if (existing) {
    const average_available_capacity =
      (Number(existing.average_available_capacity) + totalAvailability) / 2;
    return await db.put("availability", {
      id: existing.id,
      query,
      at,
      average_available_capacity,
    });
  } else {
    return await db.add("availability", {
      query,
      at,
      average_available_capacity: totalAvailability,
    });
  }
}

function getTimeString(date) {
  var d = new Date(date),
    hours = "" + d.getHours(),
    minutes = "" + d.getMinutes();
  return [hours, minutes].map((s) => (s.length < 2 ? "0" + s : s)).join(":");
}

async function getAvailabilityStatsForQuery(query) {
  if (typeof query !== "string") {
    query = JSON.stringify(query);
  }
  const db = await getDB();
  const availability = await db.getAllFromIndex(
    "availability",
    "query_idx",
    query
  );
  return availability.filter((d) => d.average_available_capacity > 0);
}

let db;
async function getDB() {
  if (!db) {
    db = await idb.openDB("covid", 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("subscriptions")) {
          // if there's no "subscriptions" store
          db.createObjectStore("subscriptions", { keyPath: "id" }); // create it
        }
        if (!db.objectStoreNames.contains("availability")) {
          const store = db.createObjectStore("availability", {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("query_idx", "query", { unique: false });
        }
      },
    });
  }
  return Promise.resolve(db);
}

function parseDate(date) {
  try {
    var [day, month, year] = date.split("-").map((d) => parseInt(d));
    var d = new Date();
    d.setFullYear(year);
    d.setMonth(month - 1);
    d.setDate(day);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMinutes(0);
    return d;
  } catch (e) {
    console.error(e);
    return new Date();
  }
}

function openOrFocusLink(link) {
  // This looks to see if the current is already open and
  // focuses if it is
  return clients
    .matchAll({
      includeUncontrolled: true,
      type: "window",
    })
    .then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url == link && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(link || "/");
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

// the default maxium is (2^31)-1 ms (2147483647 ms) or 24.855 days
function setTimeoutForLargeDelays(_fn, delay) {
  const maxDelay = Math.pow(2, 31) - 1;
  if (delay > maxDelay) {
    const args = arguments;
    args[1] -= maxDelay;
    return setTimeout(function () {
      setTimeoutForLargeDelays.apply(undefined, args);
    }, maxDelay);
  }
  return setTimeout.apply(undefined, arguments);
}

function reportToGA(eventCategory, eventAction) {
  if (location.hostname !== "sembark.com") return;
  fetch("https://www.google-analytics.com/collect", {
    method: "post",
    body: JSON.stringify({
      tid: "G-2DEQQHZL6V",
      cid: gcid,
      v: 1, // Version Number
      t: "event", // Hit Type
      ec: eventCategory, // Event Category
      ea: eventAction, // Event Action
      el: "covid-serviceworker", // Event Label
    }),
  });
}

const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

async function fetchStates() {
  const resp = await fetch(
    "https://cdn-api.co-vin.in/api/v2/admin/location/states"
  );
  const json = await resp.json();
  return json.states;
}

async function fetchDistrictsForState(state) {
  const resp = await fetch(
    "https://cdn-api.co-vin.in/api/v2/admin/location/districts/" +
      state.state_id
  );
  const json = await resp.json();
  return json.districts.map((d) => ({
    ...d,
    state,
    slug: (d.district_name + " " + state.state_name)
      .replace(/[^\d\w]/gi, "-")
      .toLowerCase(),
  }));
}

async function getData() {
  let states = await fetchStates();
  const districts = await Promise.all(
    states.map((state) => fetchDistrictsForState(state))
  ).then((resps) =>
    resps.reduce((districts, resp) => districts.concat(resp), [])
  );

  return { districts };
}

getData().then((data) => {
  fs.writeFileSync(
    path.join(__dirname, "../src/_data/covid.js"),
    `// prettier-ignore
module.exports = ${JSON.stringify(data)}
`,
    (err) => {
      if (err) throw err;
      console.log("Districts data created!");
    }
  );
});

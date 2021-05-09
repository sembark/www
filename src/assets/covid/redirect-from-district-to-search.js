function winLoad(callback) {
  if (document.readyState === "complete") {
    callback();
  } else {
    window.addEventListener("load", callback);
  }
}

winLoad(function () {
  setTimeout(() => {
    const container = document.getElementById("pageContainer");
    const districtId = container.getAttribute("data-districtId");
    window.location =
      window.location.origin +
      "/covid/vaccination-slots-availability?district_id=" +
      districtId +
      "&minAgeLimit=18&utm_source=direct&utm_medium=site&utm_campaign=covid-vaccination";
  }, 100);
});

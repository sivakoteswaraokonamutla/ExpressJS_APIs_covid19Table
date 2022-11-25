const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "covid19India.db");
let db = null;
const initializedbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializedbandserver();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

const convertDbObjectToResponseObjectforapi1 = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,

    population: dbObject.population,
  };
};
//API1
app.get("/states/", async (request, response) => {
  const query = `select * from state;`;
  let myarr = [];
  const res = await db.all(query);
  for (let each of res) {
    let outp = convertDbObjectToResponseObjectforapi1(each);
    myarr.push(outp);
  }
  response.send(myarr);
});
//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const query = `select * from state where state_id=${stateId};`;
  const res = await db.get(query);
  let out = convertDbObjectToResponseObjectforapi1(res);
  response.send(out);
});
//API3
app.post("/districts/", async (request, response) => {
  const distdetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = distdetails;
  const query = `insert into district(district_name,
        state_id,cases,cured,active,deaths)
        values('${districtName}',${stateId},${cases},
        ${cured},${active},${deaths});`;
  const dbres = await db.run(query);
  response.send("District Successfully Added");
});
//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `select * from district where district_id=${districtId};`;
  const res = await db.get(query);
  let op = {
    districtId: res.district_id,
    districtName: res.district_name,
    stateId: res.state_id,
    cases: res.cases,
    cured: res.cured,
    active: res.active,
    deaths: res.deaths,
  };
  response.send(op);
});
//API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const query = `delete from district where district_id=${districtId};`;
  await db.run(query);
  response.send("District Removed");
});
//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const disdetails = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = disdetails;
  const query = `update district
        set district_name='${districtName}',
            state_id=${stateId},
            cases=${cases},cured=${cured},active=${active},deaths=${deaths};`;
  await db.run(query);
  response.send("District Details Updated");
});
//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const query = `select sum(cases) as totalCases,sum(cured) as totalCured,sum(active) as totalActive,sum(deaths) as totalDeaths
    from district where state_id=${stateId}
    group by state_id;`;
  const res = await db.get(query);
  response.send(res);
});
//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const query = `select state_name as stateName from state join district on state.state_id=district.state_id
    where district_id=${districtId};`;
  const res = await db.get(query);
  response.send(res);
});
module.exports = app;

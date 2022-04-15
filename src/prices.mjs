import "./polyfills.mjs";
import express from "express";

// Refactor the following code to get rid of the legacy Date class.
// Use Temporal.PlainDate instead. See /test/date_conversion.spec.mjs for examples.

function createApp(database) {
  const app = express();

  app.put("/prices", (req, res) => {
    const liftPassCost = req.query.cost;
    const liftPassType = req.query.type;
    database.setBasePrice(liftPassType, liftPassCost);
    res.json();
  });

  app.get("/prices", (req, res) => {
    const age = req.query.age;
    const type = req.query.type;
    const baseCost = database.findBasePriceByType(type).cost;
    const date = parseDate(req.query.date);
    const date_foo = parsePlainDate(req.query.date)
    const cost = calculateCost(age, type, date, baseCost, date_foo);
    res.json({ cost });
  });

  function parseDate(dateString) {
    if (dateString) {
      return new Date(dateString);
    }
  }
  
  function parsePlainDate(dateString) { return (dateString ? Temporal.PlainDate.from(dateString) : dateString); }

  function calculateCost(age, type, date, baseCost, date_foo) {
    if (type === "night") {
      return calculateCostForNightTicket(age, baseCost);
    } else {
      return calculateCostForDayTicket(age, date, baseCost, date_foo);
    }
  }

  function calculateCostForNightTicket(age, baseCost) {
    if (age === undefined) {
      return 0;
    }
    if (age < 6) {
      return 0;
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.4);
    }
    return baseCost;
  }

  function calculateCostForDayTicket(age, date, baseCost, date_foo) {
    let reduction = calculateReduction(date, date_foo);
    if (age === undefined) {
      return Math.ceil(baseCost * (1 - reduction / 100));
    }
    if (age < 6) {
      return 0;
    }
    if (age < 15) {
      return Math.ceil(baseCost * 0.7);
    }
    if (age > 64) {
      return Math.ceil(baseCost * 0.75 * (1 - reduction / 100));
    }
    return Math.ceil(baseCost * (1 - reduction / 100));
  }

  function calculateReduction(date, date_foo) {
    let reduction = 0;
    if (date_foo && isMonday(date, date_foo) && !isHoliday(date_foo, date_foo)) {
      reduction = 35;
    }
    return reduction;
  }

  function isMonday(date, date_foo) {
    return date_foo.dayOfWeek === 1;
  }

  function isHoliday(date, date_foo) {
    const holidays = database.getHolidays();
    for (let row of holidays) {
      let holiday_foo = parsePlainDate(row.holiday);
      let holiday = parsePlainDate(row.holiday);
      if (
        date &&
        date.equals(holiday_foo)
      ) {
        return true;
      }
    }
    return false;
  }

  return app;
}

export { createApp };

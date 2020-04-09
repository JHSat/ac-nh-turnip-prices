//Reusable Fields
const getSellFields = function () {
  let fields = []
  for (var i = 2; i < 14; i++) {
    fields.push($("#sell_" + i)[0])
  }
  return fields
}

const sell_inputs = getSellFields()
const buy_input = $("#buy")
const first_buy_field = $("#first_buy");
const previous_pattern_input = $("#previous_pattern");

//Functions
const fillFields = function (prices, first_buy, previous_pattern) {
  first_buy_field.prop("checked", first_buy);
  previous_pattern_input.val(previous_pattern);

  buy_input.focus();
  buy_input.val(prices[0] || '')
  buy_input.blur();
  const sell_prices = prices.slice(2)

  sell_prices.forEach((price, index) => {
    if (!price) {
      return
    } else {
      const element = $("#sell_" + (index + 2));
      element.focus();
      element.val(price);
      element.blur();
    }
  })
}

const initialize = function () {
  try {
    const prices = getPrices()
    const first_buy = getFirstBuyState();
    const previous_pattern = getPreviousPatternState();
    if (prices === null) {
      fillFields([], first_buy, previous_pattern)
    } else {
      fillFields(prices, first_buy, previous_pattern)
    }
    $(document).trigger("input");
  } catch (e) {
    console.error(e);
  }

  $("#reset").on("click", function () {
    first_buy_field.prop('checked', false);
    $("select").val(null);
    $("input").val(null).trigger("input");
  })

  $('select').formSelect();
}

const updateLocalStorage = function (prices, first_buy, previous_pattern) {
  try {
    if (prices.length !== 14) throw "The data array needs exactly 14 elements to be valid"
    localStorage.setItem("sell_prices", JSON.stringify(prices))
    localStorage.setItem("first_buy", JSON.stringify(first_buy));
    localStorage.setItem("previous_pattern", JSON.stringify(previous_pattern));
  } catch (e) {
    console.error(e)
  }
}

const isEmpty = function (arr) {
  const filtered = arr.filter(value => value !== null && value !== '' && !isNaN(value))
  return filtered.length == 0
}

const getFirstBuyState = function () {
  return JSON.parse(localStorage.getItem('first_buy'))
}

const getPreviousPatternState = function () {
  return JSON.parse(localStorage.getItem('previous_pattern'))
}

const getPricesFromLocalstorage = function () {
  try {
    const sell_prices = JSON.parse(localStorage.getItem("sell_prices"));

    if (!Array.isArray(sell_prices) || sell_prices.length !== 14) {
      return null;
    }

    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPricesFromQuery = function () {
  try {
    const params = new URLSearchParams(window.location.search.substr(1));
    const sell_prices = params.get("prices").split(".").map((x) => parseInt(x, 10));

    if (!Array.isArray(sell_prices)) {
      return null;
    }

    // Parse the array which is formatted like: [price, M-AM, M-PM, T-AM, T-PM, W-AM, W-PM, Th-AM, Th-PM, F-AM, F-PM, S-AM, S-PM, Su-AM, Su-PM]
    // due to the format of local storage we need to double up the price at the start of the array.
    sell_prices.unshift(sell_prices[0]);

    // This allows us to fill out the missing fields at the end of the array
    for (let i = sell_prices.length; i < 14; i++) {
      sell_prices.push(0);
    }

    window.price_from_query = true;
    return sell_prices;
  } catch (e) {
    return null;
  }
};

const getPrices = function () {
  return getPricesFromQuery() || getPricesFromLocalstorage();
};

const getSellPrices = function () {
  //Checks all sell inputs and returns an array with their values
  return res = sell_inputs.map(function (input) {
    return parseInt(input.value || '');
  })
}

const calculateOutput = function (data, first_buy, previous_pattern) {
  if (isEmpty(data)) {
    $("#output").html("");
    return;
  }
  let output_possibilities = "";
  for (let poss of analyze_possibilities(data, first_buy, previous_pattern)) {
    var out_line = "<tr><td>" + poss.pattern_description + "</td>"
    out_line += `<td>${Number.isFinite(poss.probability) ? ((poss.probability * 100).toPrecision(3) + '%') : '—'}</td>`;
    for (let day of poss.prices.slice(1)) {
      if (day.min !== day.max) {
        out_line += `<td>${day.min}..${day.max}</td>`;
      } else {
        out_line += `<td class="one">${day.min}</td>`;
      }
    }
    out_line += `<td class="one">${poss.weekGuaranteedMinimum}</td><td class="one">${poss.weekMax}</td></tr>`;
    output_possibilities += out_line
  }

  $("#output").html(output_possibilities)
}

const update = function () {
  const sell_prices = getSellPrices();
  const buy_price = parseInt(buy_input.val());
  const first_buy = first_buy_field.is(":checked");
  const previous_pattern = parseInt(previous_pattern_input.val());

  buy_input.prop('disabled', first_buy);

  const prices = [buy_price, buy_price, ...sell_prices];
  if (!window.price_from_query) {
    updateLocalStorage(prices, first_buy, previous_pattern);
  }
  calculateOutput(prices, first_buy, previous_pattern);
}

$(document).ready(initialize);
$(document).on("input", update);
$(previous_pattern_input).on("change", update);

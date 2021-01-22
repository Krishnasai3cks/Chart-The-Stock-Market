const socket = io();
let chartData = {};
let lineChart;
let createdData = ["GOOG"];
var colors = [
    "purple",
    "lightblue",
    "red",
    "yellow",
    "lightgrey",
    "green",
    "cyan",
    "blue",
    "grey",
    "pink",
    "brown",
    "orange",
    "lightgreen",
];

function updateCreatedData(sym) {
    if (createdData.indexOf(sym) > -1) {
        return;
    } else createdData.push(sym);
    let obj = { symbol: sym };

    addNewSymbol(obj, true);
}
socket.on("update-add", (symbol) => {
    updateCreatedData(symbol.symbol);
});
socket.on("update-remove", (symbol) => {
    let remove = symbol.symbol;
    console.log(remove);
    let index = createdData.indexOf(remove);
    if (index > 0) {
        lineChart.data.datasets = lineChart.data.datasets.filter(
            (item) => item.label !== remove
        );
        lineChart.update();
        createdData = createdData.filter((item) => item !== remove);
        let innerhtml = "";
        createdData.forEach((data) => {
            if (data !== "GOOG")
                innerhtml += `<li>${data} <span style="color:red">X</span></li>`;
        });
        document.getElementById("ulist").innerHTML = innerhtml;
        remove = "";
    }
});
$.ajax({
    url: "/init",
    type: "GET",
    dataType: "json",
    success: (data) => {
        let color = colors[Math.floor(Math.random() * colors.length)];
        let lineData = createLineData(data);
        chartData.datasets = [createDataSet(lineData, color)];
        chartData.labels = createLabelDate(data);
        return chartData;
    },
});

function createLabelDate(data) {
    let dateList = [];
    data.dataset.data.forEach((item) => {
        dateList.push(item[0]);
    });
    return dateList.reverse();
}

function createLineData(data) {
    let { dataset_code: name, data: dataCols } = data.dataset;
    let dataList = [];
    dataCols.forEach((item) => {
        dataList.push(item[4]);
    });
    dataList.reverse();
    dataList.unshift(name);
    return dataList;
}

function createDataSet(dataList, color) {
    let tooltip = dataList.shift();
    let dataSet = {
        label: tooltip,
        data: dataList,
        fill: false,
        borderColor: color,
        pointBackgroundColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
    };
    return dataSet;
}
setTimeout(function() {
    let chart = $("#chart");
    lineChart = new Chart(chart, {
        type: "line",
        data: chartData,
        options: {
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "Price (USD $)",
                    },
                }, ],
            },
            maintainAspectRatio: false,
            title: {
                display: true,
                text: "Stock Market Chart",
                fontSize: 20,
                fontColor: "#999999",
            },
            legend: {
                position: "bottom",
                labels: {
                    boxWidth: 20,
                    fontSize: 14,
                },
            },
        },
    });

    symbolArray.forEach((symbol) => {
        createdData = ["GOOG"];
        if (createdData.indexOf(symbol) > -1) {
            return;
        } else createdData.push(symbol);
        let obj = { symbol };
        addNewSymbol(obj);
    });
}, 4000);
$("#addSymbol").click(() => {
    let symbol = $("#symbol").val();
    if (createdData.indexOf(symbol) > -1) {
        return;
    }

    let obj = { symbol };
    $("#symbol").val("");
    addNewSymbol(obj);
});

async function addNewSymbol(obj, updation = false) {
    console.log(obj);
    $.ajax({
        url: "/add",
        type: "post",
        dataType: "json",
        data: obj,
        success: (data) => {
            let color = colors[Math.floor(Math.random() * colors.length)];
            let lineData = createLineData(data);
            lineChart.data.datasets.push(createDataSet(lineData, color));
            lineChart.update();
            let innerhtml = "";
            if (updation) {
                createdData.forEach((data) => {
                    if (data !== "GOOG")
                        innerhtml += `<li>${data} <span style="color:red">X</span></li>`;
                });
            }
            if (!createdData.includes(obj.symbol)) {
                createdData.push(obj.symbol);
                if (!updation) {
                    socket.emit("addsymbol", { symbol: obj.symbol });
                }
                createdData.forEach((data) => {
                    if (data !== "GOOG")
                        innerhtml += `<li>${data} <span style="color:red">X</span></li>`;
                });
            }
            document.getElementById("ulist").innerHTML = innerhtml;
        },
    });
}
setInterval(() => {
    $("#ulist>li").click((event) => {
        let remove = event.target.innerText.replace(" X", "");
        let index = createdData.indexOf(remove);
        if (index > 0) {
            lineChart.data.datasets = lineChart.data.datasets.filter(
                (item) => item.label !== remove
            );
            lineChart.update();
            createdData = createdData.filter((item) => item !== remove);
            let innerhtml = "";
            createdData.forEach((data, index) => {
                if (data !== "GOOG")
                    innerhtml += `<li>${data} <span style="color:red">X</span></li>`;
            });
            document.getElementById("ulist").innerHTML = innerhtml;
            socket.emit("removesymbol", { symbol: remove });
            remove = "";
        }
    });
});
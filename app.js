require("dotenv").config();
const imu = require("node-sense-hat").Imu;
const IMU = new imu.IMU();
const matrix = require("node-sense-hat").Leds;
const sense = require("sense-hat-led").sync;

const clientFromConnectionString = require("azure-iot-device-mqtt")
  .clientFromConnectionString;
const Message = require("azure-iot-device").Message;

const connectionString = process.env.DeviceConnectionString;
const client = clientFromConnectionString(connectionString);

let interval = 3000;
let sendDataTimer;

const randomLED = (req, res) => {
  console.log("flash led");
  res.send(200, "OK!", err => {
    if (!!err) {
      console.error(
        "An error ocurred when sending a method response:\n" + err.toString()
      );
    } else {
      console.log(
        "Response to method '" + req.methodName + "' sent successfully."
      );
    }
  });

  const randInt = max => {
    return Math.floor(Math.random() * (max + 1));
  };
  for (let i = 0; i < 1000; i++) {
    x = randInt(7);
    y = randInt(7);
    r = randInt(255);
    g = randInt(255);
    b = randInt(255);
    sense.setPixel(x, y, r, g, b);
    sense.sleep(0.01);
  }
};

const sendMessage = messageText => {
  const message = new Message(messageText);
  client.sendEvent(message, err => {
    if (err) console.log(err.toString());
  });
  sense.setPixel(0, 0, 255, 255, 0);
  sense.sleep(0.5);
  sense.setPixel(0, 0, 0, 0, 0);
};

const formatData = raw => {
  const data = {};
  data.accelX = raw.accel.x;
  data.accelY = raw.accel.y;
  data.accelZ = raw.accel.z;
  data.temperature = raw.temperature;
  data.humidity = raw.humidity;
  data.time = raw.timestamp;

  return data;
};

const getSensorData = () => {
  return new Promise((resolve, reject) => {
    IMU.getValue((err, data) => {
      if (err != null) {
        console.error("Could not read sensor data: ", err);
        return;
      }
      resolve(data);
    });
  });
};

const sendSensorData = interval => {
  sendDataTimer = setInterval(() => {
    getSensorData().then(rawData => {
      const sensorData = formatData(rawData);
      console.log("sensorData", sensorData);
      sendMessage(JSON.stringify(sensorData));
    });
  }, interval);
};

client.open(err => {
  if (err) {
    console.error("Could not connect: " + err.message);
    return;
  }
  sendSensorData(interval);
  client.onDeviceMethod("random", randomLED);
});

/////////////////////////////////////////////////////////////////////
sense.showMessage("Hello!", 0.1, [255, 255, 255], [50, 50, 50]);

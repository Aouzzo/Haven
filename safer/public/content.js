export const plannedFeatures = [
  ['01', 'Care, without a camera.', 'A proposed way to sense changes in movement without recording images or audio. Privacy considerations will guide development.'],
  ['02', 'Nothing new to remember.', 'The concept is designed around the room, rather than a pendant a resident needs to wear or a button they need to press.'],
  ['03', 'A signal to check in.', 'A possible fall could prompt a caregiver notification. Alert delivery and care-team workflows remain to be developed and validated.']
];
export const specifications = [
  ['Prototype hardware direction', 'ESP32-based Wi-Fi sensing'],
  ['Sensing approach', 'Wi-Fi channel state information (CSI)'],
  ['Enclosure & mounting', 'Concept visualization · design to be confirmed'],
  ['Coverage & placement', 'To be established through testing'],
  ['Detection performance', '95% of activities identified on a held-out test in a trained room (our own tests, best sensor placement) · not yet tested in a facility'],
  ['AI model', 'Webcam-taught: MediaPipe Pose labels during training, Wi-Fi-only model at run time'],
  ['Power & connectivity requirements', 'Specifications to be confirmed'],
  ['Integrations & alert delivery', 'Prototype dashboard · nurse-call integration planned']
];
export const faqs = [
  ['Is this a working fall-detection system?', 'It is a working hackathon prototype. Our three ESP32 boards and model identify activities, including someone lying on the floor after a fall, in rooms they were trained in; see the demo video on the home page. The 3D story on the home page is a simulation that shows the idea. Haven has not yet been tested in a care facility, and it is not a medical device.'],
  ['How does Wi-Fi sense movement?', 'Movement changes how radio signals travel through a room. Our boards measure those changes (channel state information, or CSI). During training, a webcam labels what the person is doing, and a machine-learning model learns which Wi-Fi patterns go with each activity. After that, the camera is removed and Haven runs on Wi-Fi alone.'],
  ['Would residents need to wear a device?', 'The proposed concept uses devices installed in the environment rather than wearables. Installation requirements, coverage and practical limitations remain to be determined.'],
  ['Are cameras or microphones part of the concept?', 'No. The proposed sensing approach uses Wi-Fi signals rather than images or audio. Data handling and privacy safeguards are still design work, not verified capabilities.'],
  ['When can a community try Haven?', 'We are starting with the assisted living community next door to us. Pilot timing, requirements and pricing are still being worked out.']
];

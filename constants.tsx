
import React from 'react';
import { Language, Department, Translation } from './types';
import { Zap, Flame, Building2, MapPin, Truck, Waves, Trash2 } from 'lucide-react';

export const TRANSLATIONS: Record<Language, Translation> = {
  [Language.ENGLISH]: {
    welcome: "Welcome to SUVIDHA",
    selectLanguage: "Please Select Your Language",
    loginTitle: "Citizen Authentication",
    enterMobile: "Enter 10-Digit Mobile Number",
    getOtp: "Get OTP",
    verifyOtp: "Verify & Login",
    homeTitle: "How can we help you today?",
    trackStatus: "Track Application Status",
    fileComplaint: "New Service Request",
    adminLogin: "Official Login",
    back: "Go Back",
    submit: "Submit",
    close: "Close",
    complaintSuccess: "Request Submitted Successfully",
    requestId: "Request ID"
  },
  [Language.HINDI]: {
    welcome: "सुविधा में आपका स्वागत है",
    selectLanguage: "कृपया अपनी भाषा चुनें",
    loginTitle: "नागरिक प्रमाणीकरण",
    enterMobile: "10-अंकीय मोबाइल नंबर दर्ज करें",
    getOtp: "ओटीपी प्राप्त करें",
    verifyOtp: "सत्यापित करें और लॉगिन करें",
    homeTitle: "आज हम आपकी क्या मदद कर सकते हैं?",
    trackStatus: "आवेदन की स्थिति ट्रैक करें",
    fileComplaint: "नई सेवा अनुरोध",
    adminLogin: "आधिकारिक लॉगिन",
    back: "पीछे जाएं",
    submit: "जमा करें",
    close: "बंद करें",
    complaintSuccess: "अनुरोध सफलतापूर्वक जमा किया गया",
    requestId: "अनुरोध आईडी"
  },
  [Language.MARATHI]: {
    welcome: "सुविधा मध्ये आपले स्वागत आहे",
    selectLanguage: "कृपया तुमची भाषा निवडा",
    loginTitle: "नागरिक प्रमाणीकरण",
    enterMobile: "10-अंकी मोबाईल नंबर प्रविष्ट करा",
    getOtp: "ओटीपी मिळवा",
    verifyOtp: "सत्यापित करा आणि लॉगिन करा",
    homeTitle: "आज आम्ही तुम्हाला कशी मदत करू शकतो?",
    trackStatus: "अर्जाची स्थिती तपासा",
    fileComplaint: "नवीन सेवा विनंती",
    adminLogin: "शासकीय लॉगिन",
    back: "परत जा",
    submit: "सबमिट करा",
    close: "बंद करें",
    complaintSuccess: "विनंती यशस्वीरित्या सबमिट केली",
    requestId: "विनंती आयडी"
  }
};

export const DEPARTMENTS_DATA = [
  {
    id: Department.ELECTRICITY,
    icon: <Zap className="w-12 h-12 text-yellow-400" />,
    color: "bg-yellow-400/5",
    border: "border-yellow-400/20",
    hoverBorder: "hover:border-yellow-400/50",
    services: ["Meter Fault", "Power Outage", "Bill Correction", "New Connection"]
  },
  {
    id: Department.GAS,
    icon: <Flame className="w-12 h-12 text-orange-400" />,
    color: "bg-orange-400/5",
    border: "border-orange-400/20",
    hoverBorder: "hover:border-orange-400/50",
    services: ["Leakage Report", "Cylinder Refill Issue", "New Pipeline Connection", "Name Change"]
  },
  {
    id: Department.MUNICIPAL,
    icon: <Building2 className="w-12 h-12 text-blue-400" />,
    color: "bg-blue-400/5",
    border: "border-blue-400/20",
    hoverBorder: "hover:border-blue-400/50",
    services: ["Water Supply", "Waste Collection", "Street Light Repair", "Road Repair"]
  }
];

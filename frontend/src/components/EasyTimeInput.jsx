import React, { useState, useEffect } from "react";
import { parse24To12, compose12To24, formatTimeTo12Hr } from "../utils/timeUtils";

const EasyTimeInput = ({ label, value, onChange, id }) => {
  // Parse current value (HH:MM string)
  const { hour12, minute, period } = parse24To12(value || "09:00");

  const handle12Change = (newHour, newMinute, newPeriod) => {
    const val24 = compose12To24(newHour, newMinute, newPeriod);
    onChange(val24);
  };

  const hoursList = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12"
  ];

  const minutesList = [
    "00", "05", "10", "15", "20", "25",
    "30", "35", "40", "45", "50", "55"
  ];

  const adjustHour = (delta) => {
    let current = parseInt(hour12, 10);
    let next = current + delta;
    if (next > 12) next = 1;
    if (next < 1) next = 12;
    const nextStr = next < 10 ? `0${next}` : `${next}`;
    handle12Change(nextStr, minute, period);
  };

  return (
    <div className="easy-time-group">
      <div className="easy-time-header">
        <label htmlFor={id} className="easy-time-label">
          {label}
        </label>
      </div>

      <div className="time-picker-12">
        {/* Hour Selector with Step Buttons */}
        <div className="picker-col">
          <span className="picker-sublabel">Hour</span>
          <div className="stepper-input-wrap">
            <button
              type="button"
              className="step-btn"
              onClick={() => adjustHour(-1)}
              title="Decrease hour"
            >
              -
            </button>
            <select
              className="time-select hour-select"
              value={hour12}
              onChange={(e) => handle12Change(e.target.value, minute, period)}
            >
              {hoursList.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="step-btn"
              onClick={() => adjustHour(1)}
              title="Increase hour"
            >
              +
            </button>
          </div>
        </div>

        <span className="colon-separator">:</span>

        {/* Minute Selector */}
        <div className="picker-col">
          <span className="picker-sublabel">Minute</span>
          <select
            className="time-select minute-select"
            value={minutesList.includes(minute) ? minute : minute}
            onChange={(e) => handle12Change(hour12, e.target.value, period)}
          >
            {/* If minute is not a standard multiple of 5, include it */}
            {!minutesList.includes(minute) && (
              <option value={minute}>{minute}</option>
            )}
            {minutesList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* AM / PM Toggle Buttons */}
        <div className="picker-col period-col">
          <span className="picker-sublabel">Period</span>
          <div className="period-toggle-group">
            <button
              type="button"
              className={`period-btn am-btn ${period === "AM" ? "active" : ""}`}
              onClick={() => handle12Change(hour12, minute, "AM")}
            >
              AM
            </button>
            <button
              type="button"
              className={`period-btn pm-btn ${period === "PM" ? "active" : ""}`}
              onClick={() => handle12Change(hour12, minute, "PM")}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* Preview Badge */}
      <div className="time-preview-badge">
        <span className="preview-icon"></span>
        <span className="preview-main">{formatTimeTo12Hr(value || "09:00")}</span>
      </div>
    </div>
  );
};

export default EasyTimeInput;

import React, { useState, useEffect } from "react";
import { getSettings, editSettings } from "../api";
import FormField from "../components/formfield";
import Button from "../components/button";
import { AdminContext } from "../providers/AdminContext";
import "../styles/AdvancedSettings.css";

interface AdvancedSettingsProps {}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = () => {
  const { uid, token } = React.useContext(AdminContext);
  const [settings, setSettings] = useState({
    auth: { email: "", pincode: "", password: "" },
    clockin: { roundTime: "", timeBetween: "" },
  });

  const [editedSettings, setEditedSettings] = useState(settings);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await getSettings(uid, token);
      const newSettings = {
        auth: { email: res.email, pincode: "", password: "" },
        clockin: {
          roundTime: res.clockin.roundTime,
          timeBetween: res.clockin.timeBetween,
        },
      };
      setSettings(newSettings);
      setEditedSettings(newSettings);
    };
    fetchSettings();
  }, [uid, token]);

  const handleEditClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setEditedSettings(settings);
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setEditedSettings(settings);
    setIsEditing(false);
  };

  const handleSubmitClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setSettings(editedSettings);
    setIsEditing(false);
    // Add logic to save changes if necessary
    editSettings(uid, token, editedSettings);
  };

  const handleChange =
    (section: keyof typeof settings, field: string) => (value: string) => {
      setEditedSettings((prevSettings) => ({
        ...prevSettings,
        [section]: {
          ...prevSettings[section],
          [field]: value,
        },
      }));
    };

  return (
    <>
      <div className="advanced-settings">
        <div className="advanced-settings-header">
          <h1>Advanced Settings</h1>
        </div>
        <div className="advanced-settings-container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="advanced-settings-form"
          >
            <div className="app-settings">
              <h2>App Settings</h2>
              <FormField
                value={
                  isEditing
                    ? editedSettings.clockin.roundTime
                    : settings.clockin.roundTime
                }
                label="Round Time"
                id="round-time"
                required={true}
                formSubmitted={false}
                onChange={handleChange("clockin", "roundTime")}
                disbabled={!isEditing}
              />
              <FormField
                value={
                  isEditing
                    ? editedSettings.clockin.timeBetween
                    : settings.clockin.timeBetween
                }
                label="Time Between Clock In/Out"
                id="time-between"
                required={true}
                formSubmitted={false}
                onChange={handleChange("clockin", "timeBetween")}
                disbabled={!isEditing}
              />
            </div>
            <hr className="split" />
            <div className="user-settings">
              <h2>User Settings</h2>
              <FormField
                value={
                  isEditing
                    ? editedSettings.auth.pincode
                    : settings.auth.pincode
                }
                label="Pincode"
                id="pincode"
                required={true}
                formSubmitted={false}
                sensitive={true}
                onChange={handleChange("auth", "pincode")}
                strict="digit"
                limit={4}
                disbabled={!isEditing}
              />
              <FormField
                value={
                  isEditing
                    ? editedSettings.auth.password
                    : settings.auth.password
                }
                label="Password"
                id="password"
                required={true}
                formSubmitted={false}
                sensitive={true}
                onChange={handleChange("auth", "password")}
                disbabled={!isEditing}
              />
              <FormField
                value={
                  isEditing ? editedSettings.auth.email : settings.auth.email
                }
                label="Email"
                id="email"
                required={true}
                formSubmitted={false}
                onChange={handleChange("auth", "email")}
                disbabled={!isEditing}
              />
            </div>

            <div className="actions">
              {!isEditing ? (
                <Button text="Edit Settings" onClick={handleEditClick} />
              ) : (
                <>
                  <Button
                    text="Submit"
                    onClick={handleSubmitClick}
                    type="submit"
                  />
                  <Button
                    text="Cancel"
                    onClick={handleCancelClick}
                    type="reset"
                    style={{ cancel: true }}
                  />
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdvancedSettings;

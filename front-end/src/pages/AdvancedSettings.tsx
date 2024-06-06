import React, { useState, useEffect, useContext } from "react";
import { getSettings, editSettings } from "../api";
import { AdminContext } from "../providers/AdminContext";
import FormField from "../components/formfield";
import Button from "../components/button";
import "../styles/AdvancedSettings.css";
import { AxiosError } from "axios";

interface AdvancedSettingsProps {}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = () => {
  const [settings, setSettings] = useState({
    auth: { email: "", pincode: "", password: "" },
    clockin: { roundTime: "", timeBetween: "" },
  });

  const [editedSettings, setEditedSettings] = useState(settings);
  const [isEditing, setIsEditing] = useState(false);

  const { logout } = useContext(AdminContext);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSettings();
        const newSettings = {
          auth: { email: res.email, pincode: "", password: "" },
          clockin: {
            roundTime: res.clockin.roundTime,
            timeBetween: res.clockin.timeBetween,
          },
        };
        setSettings(newSettings);
        setEditedSettings(newSettings);
      } catch (error) {
        const err = error as AxiosError;
        if (err.response && err.response.status === 403) {
          logout();
        } else {
          console.error("Error fetching settings", error);
        }
      }
    };
    fetchSettings();
  }, []);

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
    editSettings(editedSettings).catch((error) => {
      const err = error as AxiosError;
      if (err.response && err.response.status === 403) {
        logout();
      } else {
        console.error("Error editing settings", error);
      }
    });
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
                limit={2}
                strict="digit"
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
                limit={2}
                strict="digit"
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
                span="Not shown due to security"
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
                span="Not shown due to security"
              />
              <div className="email">
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

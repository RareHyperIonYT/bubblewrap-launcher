import { useEffect, useRef, useState } from "react";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CONFIG_SCHEMA, appDefaults } from "../utility/configSchema.js";

// TODO: Remove "renderField" helper, and just use FieldRow directly.
// TODO: Make it so there isn't a global "apiVisible" and "setApiVisible" so we can have more things that may need hidden in the future.

function renderField(fieldKey, field, local, update, apiVisible, setApiVisible) {
    if (!field) return null;

    return (
        <FieldRow
            key={fieldKey}
            fieldKey={fieldKey}
            field={field}
            value={local[fieldKey]}
            onChange={(v) => update(fieldKey, v)}
            visible={apiVisible}
            setVisible={setApiVisible}
        />
    );
}

export default function Settings({ settings, onSave }) {
    const [local, setLocal] = useState(() => ({ ...appDefaults(), ...settings }));
    const [dirty, setDirty] = useState(false);
    const [apiVisible, setApiVisible] = useState({});

    useEffect(() => {
        setLocal({ ...appDefaults(), ...settings });
        setDirty(false);
    }, [settings]);

    function update(key, val) {
        setLocal((p) => ({ ...p, [key]: val }));
        setDirty(true);
    }

    function handleSave() {
        onSave(local);
        setDirty(false);
    }

    function handleRevert() {
        setLocal({ ...appDefaults(), ...settings });
        setDirty(false);
        setApiVisible({});
    }

    return (
        <div className="settings">
            <div className="settings__header">
                <h1 className="settings__title">Settings</h1>
                <p className="settings__sub">Configure Bubblewrap Game Launcher</p>
            </div>

            {Object.entries(CONFIG_SCHEMA).map(([sectionKey, section]) => {
                const items = section.items ?? {};
                const fields = section.fields ?? Object.keys(items);

                return (
                    <section className="settings__section" key={sectionKey}>
                        <div className="settings__section-head">
                            <span className="settings__section-name">{section.title}</span>
                        </div>

                        {section.groups
                            ? section.groups.map((group) => (
                                  <SettingGroup key={group.title} title={group.title}>
                                      {group.fields.map((fieldKey) =>
                                          renderField(
                                              fieldKey,
                                              items[fieldKey],
                                              local,
                                              update,
                                              apiVisible,
                                              setApiVisible
                                          )
                                      )}
                                  </SettingGroup>
                              ))
                            : fields.map((fieldKey) =>
                                  renderField(fieldKey, items[fieldKey], local, update, apiVisible, setApiVisible)
                              )}
                    </section>
                );
            })}

            <div className={`settings__floating-actions ${dirty ? "settings__floating-actions--visible" : ""}`}>
                <button className="btn btn--secondary" onClick={handleRevert}>
                    Revert
                </button>
                <button className="btn btn--primary" onClick={handleSave}>
                    Save Settings
                </button>
            </div>
        </div>
    );
}

// Helpers
function SettingGroup({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const contentRef = useRef(null);

    return (
        <div className="settings__group">
            <button
                type="button"
                className="settings__group-head"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span>{title}</span>
            </button>

            <div
                className={`settings__group-body-wrap ${open ? "open" : ""}`}
                style={{ maxHeight: open ? `${contentRef.current?.scrollHeight || 0}px` : "0px" }}
            >
                <div ref={contentRef} className="settings__group-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

function SettingDescription({ description }) {
    if (!description) return null;

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                a: ({ href, children }) => (
                    <button type="button" className="link-btn" onClick={() => href && openUrl(href)}>
                        {children}
                    </button>
                ),
            }}
        >
            {description}
        </ReactMarkdown>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <label className="toggle">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span className="toggle-track" />
        </label>
    );
}

function FieldControl({ fieldKey, field, value, onChange, visible, setVisible }) {
    const ui = field.ui_component ?? (field.type === "boolean" ? "toggle" : "text-input");

    if (ui === "toggle") {
        return <Toggle checked={Boolean(value)} onChange={onChange} />;
    }

    const isPassword = ui === "password-input";
    const inputType = isPassword ? (visible ? "text" : "password") : "text";

    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
                className="settings-input"
                type={inputType}
                placeholder={field.placeholder ?? ""}
                value={value ?? ""}
                onChange={(e) => {
                    const next = e.target.value;
                    onChange(next === "" ? (field.default ?? "") : next);
                }}
            />

            {isPassword && (
                <button
                    className="btn btn--secondary btn--icon"
                    title={visible ? "Hide key" : "Show key"}
                    onClick={() => setVisible((p) => ({ ...p, [fieldKey]: !p[fieldKey] }))}
                    type="button"
                >
                    {visible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            )}
        </div>
    );
}

function FieldRow({ fieldKey, field, value, onChange, visible, setVisible }) {
    return (
        <div className="settings__row">
            <div className="settings__row-info">
                <div className="settings__row-label">{field.label}</div>
                <div className="settings__row-desc">
                    <SettingDescription description={field.description} />
                </div>
            </div>

            <div className="settings__row-ctl">
                <FieldControl
                    fieldKey={fieldKey}
                    field={field}
                    value={value}
                    onChange={onChange}
                    visible={Boolean(visible?.[fieldKey])}
                    setVisible={setVisible}
                />
            </div>
        </div>
    );
}

// Icons
function EyeIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3" />
            <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
                d="M1 1l12 12M5.5 5.64A2 2 0 0 0 9 8.5M2.5 3.6C1.6 4.6 1 6 1 7s2.5 4 6 4c1.1 0 2.1-.3 2.9-.7M5 3.2C5.6 3.1 6.3 3 7 3c3.5 0 6 4 6 4s-.5 1-1.5 2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
            />
        </svg>
    );
}

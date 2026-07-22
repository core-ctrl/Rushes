// components/AuthButton.jsx
import React from "react";
import { useDispatch } from "react-redux";
import { openAuthModal } from "../store/slices/uiSlice";

export default function AuthButton() {
    const dispatch = useDispatch();
    return (
        <button onClick={() => dispatch(openAuthModal('login'))} className="bg-white/6 px-3 py-1 rounded text-white">Sign in</button>
    );
}

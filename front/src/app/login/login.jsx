import React, { useState } from "react";
import axios from "axios";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const res = await axios.post("http://localhost:5000/login", { email, password });

            // Guardar usuario en localStorage
            localStorage.setItem("user", JSON.stringify({ email, role: res.data.role }));

            setMessage(`✅ Bienvenido, tu rol es: ${res.data.role}`);
            window.location.href = "/upload"; // Redirige a UploadPage
        } catch (error) {
            setMessage(error.response?.data?.message || "❌ Error en el login.");
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <img src="/bevstacklogo.png" alt="BevStack Logo" className="login-logo" />

                <h2 className="login-title">Iniciar Sesión</h2>

                <form onSubmit={handleLogin} className="login-form">
                    <label>Email</label>
                    <input
                        type="email"
                        className="login-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label>Contraseña</label>
                    <input
                        type="password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="login-button">Iniciar Sesión</button>
                </form>

                {message && <p className="login-message">{message}</p>}
            </div>
        </div>
    );
};

export default Login;

"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { detectPPEInImage, detectAndLogFrame } from "../api";
import "./ppedetection.css";

const WEBCAM_WIDTH = 480;
const WEBCAM_HEIGHT = 360;
const UPLOAD_IMG_MAX_WIDTH = 416;
const UPLOAD_IMG_MAX_HEIGHT = 312;

const PPEDetection = () => {
  const { user, logout } = useAuth();
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detections, setDetections] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [systemStatus, setSystemStatus] = useState("Ready");
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionTimeout = useRef(null);

  useEffect(() => {
    return () => stopWebcam();
  }, []);

  useEffect(() => {
    if (isWebcamActive) {
      startWebcam();
    } else {
      stopWebcam();
    }
  }, [isWebcamActive]);

  useEffect(() => {
    if (isDetecting && isWebcamActive) {
      runDetectionLoop();
    } else {
      if (detectionTimeout.current) clearTimeout(detectionTimeout.current);
    }
  }, [isDetecting, isWebcamActive]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: WEBCAM_WIDTH, height: WEBCAM_HEIGHT }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setSystemStatus("Camera active");
    } catch (error) {
      setSystemStatus("❌ Webcam error");
      alert("Failed to access webcam. Please check permissions.");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (detectionTimeout.current) clearTimeout(detectionTimeout.current);
    setIsDetecting(false);
    setSystemStatus("Ready");
  };

  const handleDetectToggle = () => {
    if (!isWebcamActive) {
      setIsWebcamActive(true);
      setIsDetecting(false);
    } else if (!isDetecting) {
      setIsDetecting(true);
    } else {
      setIsDetecting(false);
    }
  };

  const runDetectionLoop = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = WEBCAM_WIDTH;
    canvas.height = WEBCAM_HEIGHT;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
      try {
        setSystemStatus("Detecting...");
        const result = await detectAndLogFrame(file);

        if (result && result.success) {
          setDetections(result.detections || []);

          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          if (result.annotated_image_base64) {
            const img = new Image();
            img.onload = () => {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              drawBoundingBoxes(ctx, result.detections);
            };
            img.src = `data:image/jpeg;base64,${result.annotated_image_base64}`;
          } else {
            drawBoundingBoxes(ctx, result.detections);
          }

          const hasViolation = result.violations?.some(v => v.label === "NoHelmet" || v.label === "NoVest");
          if (hasViolation) {
            alert("⚠️ PPE Violation Detected: " + result.violations.map(v => v.label).join(", "));
          } else {
            alert("✅ All Good! Helmet and Vest detected.");
          }

          setSystemStatus("Detection complete");
        } else {
          setSystemStatus("Detection failed");
        }
      } catch (err) {
        setSystemStatus("Detection error");
      }
    }, "image/jpeg", 0.8);

    detectionTimeout.current = setTimeout(runDetectionLoop, 3000);
  };

  const drawBoundingBoxes = (ctx, detections) => {
    detections.forEach(({ x, y, width, height, label }) => {
      ctx.strokeStyle = label.includes("No") ? "#ef4444" : "#10b981";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      ctx.font = "18px Arial";
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(label, x, y - 8);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    setSystemStatus("Analyzing image...");
    setDetections([]);
    setUploadProgress(0);
    setIsWebcamActive(false);

    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target.result);
    reader.readAsDataURL(file);

    try {
      const result = await detectPPEInImage(file, (progress) => setUploadProgress(progress));
      if (result && result.success) {
        setDetections(result.detections || []);
        if (result.annotated_image_base64) {
          setProcessedImage(`data:image/jpeg;base64,${result.annotated_image_base64}`);
        }
        setSystemStatus("✅ Analysis Complete");
      } else {
        setSystemStatus("❌ Detection failed");
      }
    } catch (error) {
      setSystemStatus("❌ Detection Error");
      alert(`Detection failed: ${error.message}`);
    } finally {
      setUploadProgress(0);
    }
  };

  const handleExit = () => {
    setIsDetecting(false);
    setIsWebcamActive(false);
    setUploadedImage(null);
    setProcessedImage(null);
    setDetections([]);
    setSystemStatus("Ready");
    stopWebcam();
  };

  // UI
  return (
    <div className="ppe-container">
      <div className="ppe-header">
        <div className="header-content">
          <div className="logo">
            <h1>PPE Detection System</h1>
            <p>AI-powered safety equipment monitoring</p>
          </div>
          <div className="welcome-message">
            <p>
              Welcome, <span className="username">{user?.username || "User"}</span>
            </p>
            <button
    onClick={logout}
    style={{
      backgroundColor: "#ef4444",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "bold"
    }}
  >
    Logout
  </button>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <div className="control-panel">
            <h3>Detection Controls</h3>
            <button
              className={`control-btn detect-btn ${isDetecting ? "stop" : ""}`}
              onClick={handleDetectToggle}
            >
              {!isWebcamActive ? "Start Camera" : isDetecting ? "Stop Detection" : "Start Detection"}
            </button>
            <button className="control-btn exit-btn" onClick={handleExit}>
              Exit
            </button>
          </div>
          <div className="upload-panel">
            <h3>Image Upload</h3>
            <button
              className="control-btn upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            {uploadProgress > 0 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
          <button
  onClick={() => window.location.href = "/userdashboard"}
  style={{
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    marginLeft: "12px"
  }}
>
  Dashboard
</button>

        </div>
        <div className="main-display">
          <div className="display-container">
            {isWebcamActive ? (
              <div className="webcam-container" style={{
                width: WEBCAM_WIDTH,
                height: WEBCAM_HEIGHT,
                position: "relative",
                margin: "0 auto",
                background: "#18181b",
                borderRadius: "12px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)"
              }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  style={{
                    width: WEBCAM_WIDTH,
                    height: WEBCAM_HEIGHT,
                    display: "block",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: 1,
                    background: "#18181b",
                    borderRadius: "12px"
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    width: WEBCAM_WIDTH,
                    height: WEBCAM_HEIGHT,
                    display: isDetecting ? "block" : "none",
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: 2,
                    background: "transparent",
                    borderRadius: "12px"
                  }}
                />
              </div>
            ) : uploadedImage ? (
              <div className="image-container" style={{
                width: WEBCAM_WIDTH,
                height: WEBCAM_HEIGHT,
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#18181b",
                borderRadius: "12px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
                position: "relative"
              }}>
                <img
                  src={processedImage || uploadedImage}
                  alt="Uploaded"
                  style={{
                    maxWidth: UPLOAD_IMG_MAX_WIDTH,
                    maxHeight: UPLOAD_IMG_MAX_HEIGHT,
                    objectFit: "contain",
                    display: "block",
                    margin: "auto",
                    borderRadius: "12px",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.15)"
                  }}
                />
              </div>
            ) : (
              <div className="webcam-placeholder" style={{
                width: WEBCAM_WIDTH,
                height: WEBCAM_HEIGHT,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#18181b",
                borderRadius: "12px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.10)"
              }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="camera-placeholder-icon"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  style={{ width: 64, height: 64, marginBottom: 16 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-6 0h-.01M9 14a3 3 0 100-6 3 3 0 000 6z"
                  />
                </svg>
                <h3>No Input Detected</h3>
                <p>Start the webcam or upload an image to begin detection.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className="status-value">{systemStatus}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Detections:</span>
          <span className="status-value">{detections.length}</span>
        </div>
        <div className="status-item">
          <span className="status-label">User:</span>
          <span className="status-value">{user?.username}</span>
        </div>
      </div>
    </div>
  );
};

export default PPEDetection;
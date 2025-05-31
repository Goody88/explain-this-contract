"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const hasAccess = localStorage.getItem("subscribed") === "true";
    setSubscribed(hasAccess);
  }, []);

  const handleUpload = async () => {
    if (!file || !subscribed) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    const res = await fetch("/api/explain", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult(data.result);
    setLoading(false);
  };

  const handleSubscribe = async () => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  const downloadResult = () => {
    const blob = new Blob([result], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "contract-explanation.pdf";
    link.click();
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">📄 Explain This Contract</h1>
          <p className="text-gray-600">Upload a contract and get a plain-English explanation with red flags.</p>
        </header>

        {!subscribed ? (
          <div className="text-center">
            <p className="mb-4 text-gray-700">To use this service, please subscribe for just <strong>£4.99/month</strong>.</p>
            <button
              onClick={handleSubscribe}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
            >
              Subscribe with Stripe
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full sm:flex-1 border p-2 rounded"
              />
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded disabled:opacity-50"
              >
                {loading ? "Explaining..." : "Upload & Explain"}
              </button>
            </div>

            {result && (
              <div className="bg-gray-100 p-4 rounded shadow-inner space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">🧠 Explanation:</h2>
                  {result.split(/\n+/).map((line, idx) => {
                    const isRedFlag = line.includes("[RED FLAG]");
                    return (
                      <p
                        key={idx}
                        className={isRedFlag ? "text-red-700 font-semibold" : "text-gray-700"}
                      >
                        {isRedFlag ? "⚠️ " : ""}
                        {line.replace("[RED FLAG]", "").trim()}
                      </p>
                    );
                  })}
                </div>
                <button
                  onClick={downloadResult}
                  className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
                >
                  Download as PDF
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

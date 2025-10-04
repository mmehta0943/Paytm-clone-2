/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "axios";

export const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/v1/account/requests",
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      setRequests(response.data.requests || []);
      setLoading(false);
    } catch (error) {
      console.log("Error fetching requests:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (requestId, action) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/v1/account/request/respond",
        {
          requestId,
          action,
        },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      if (response.data.status === "1") {
        alert(response.data.message);
        // Refresh the requests list
        fetchRequests();
        // Reload the page to update balance
        window.location.reload();
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert("Error processing request");
    }
  };

  if (loading) {
    return null;
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="border-2 border-blue-300 p-5 rounded-3xl bg-blue-50">
        <div className="font-bold mt-2 text-xl text-gray-800">
          Pending Money Requests
        </div>
        <div className="mt-4 space-y-4">
          {requests.map((request) => (
            <RequestItem
              key={request._id}
              request={request}
              onApprove={() => handleResponse(request._id, "approve")}
              onReject={() => handleResponse(request._id, "reject")}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function RequestItem({ request, onApprove, onReject }) {
  const formatCurrency = (amount) => {
    const numValue = parseFloat(amount) || 0;
    return `$${numValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-xl text-white font-semibold">
            {request.requesterId.firstName[0]}
          </span>
        </div>
        <div>
          <div className="font-bold text-gray-800">
            {request.requesterId.firstName} {request.requesterId.lastName}
          </div>
          <div className="text-sm text-gray-600">
            Requesting {formatCurrency(request.amount)}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium text-sm"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

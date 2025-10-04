import axios from "axios";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import ReactLoading from "react-loading";

export const RequestMoney = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const name = searchParams.get("name");
  const userId = searchParams.get("userId");
  const [amount, setAmount] = useState("");

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <div className="h-full flex flex-col justify-center">
        {!isLoading && (
          <div>
            <div className="border h-min text-card-foreground max-w-md p-4 space-y-8 w-96 bg-white shadow-lg rounded-lg">
              <div className="flex flex-col space-y-1.5 p-6">
                <h2 className="text-3xl font-bold text-center">Request Money</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center just space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-2xl text-white">
                      {name[0].toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold">
                    {name.toUpperCase()}
                  </h3>
                </div>
                <div className="space-y-4 mt-3">
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      htmlFor="amount"
                    >
                      Amount (in $)
                    </label>
                    <input
                      onChange={(e) => {
                        setAmount(e.target.value);
                      }}
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      id="amount"
                      placeholder="Enter amount"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        if (!amount || amount <= 0) {
                          alert("Please enter a valid amount");
                          return;
                        }

                        setIsLoading(true);
                        const response = await axios.post(
                          "http://localhost:3000/api/v1/account/request",
                          {
                            to: userId,
                            amount,
                          },
                          {
                            headers: {
                              Authorization:
                                "Bearer " + localStorage.getItem("token"),
                            },
                          }
                        );

                        if (response.data.status === "-1") {
                          alert(response.data.message);
                          setIsLoading(false);
                          return;
                        } else {
                          alert("Request sent successfully!");
                          setIsLoading(false);
                          navigate("/dashboard?userId=" + userId);
                        }
                      } catch (error) {
                        alert("Error sending request");
                        setIsLoading(false);
                      }
                    }}
                    className="justify-center rounded-md text-sm font-medium ring-offset-background transition-colors h-10 px-4 py-2 w-full bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Send Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {isLoading && (
          <div>
            <ReactLoading type="bars" color="#00000" height={100} width={100} />
          </div>
        )}
      </div>
    </div>
  );
};

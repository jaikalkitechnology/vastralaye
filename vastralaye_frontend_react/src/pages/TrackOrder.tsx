import { useState } from "react";

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock data
    setTrackingInfo({
      orderId: orderId,
      status: "out-for-delivery",
      driver: {
        name: "Rajesh Kumar",
        phone: "+91 98765 43210",
        vehicle: "Motorcycle"
      },
      location: "Near Bandra Kurla Complex",
      estimatedArrival: "30-45 minutes",
      progress: 85,
      timeline: [
        { time: "09:30 AM", event: "Picked up from warehouse", status: "completed" },
        { time: "10:15 AM", event: "Arrived at sorting facility", status: "completed" },
        { time: "11:30 AM", event: "Out for delivery", status: "current" },
        { time: "12:30 PM", event: "Estimated delivery", status: "pending" }
      ]
    });

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Live Order Tracking</h1>
          <p className="text-lg text-gray-600">Real-time updates for your delivery</p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <form onSubmit={handleTrack} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter your order ID..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all duration-200 disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Track</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Tracking Results */}
        {trackingInfo && (
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delivery Progress</h3>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {trackingInfo.status.replace(/-/g, ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Order Placed</span>
                  <span>Delivered</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${trackingInfo.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">Estimated arrival in</p>
                <p className="text-2xl font-bold text-gray-900">{trackingInfo.estimatedArrival}</p>
              </div>
            </div>

            {/* Driver Info */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Delivery Agent</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">
                    {trackingInfo.driver.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{trackingInfo.driver.name}</p>
                  <p className="text-sm text-gray-600">{trackingInfo.driver.vehicle}</p>
                </div>
                <a 
                  href={`tel:${trackingInfo.driver.phone}`}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Call
                </a>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Timeline</h3>
              <div className="space-y-4">
                {trackingInfo.timeline.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'current' ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.event}</p>
                      <p className="text-sm text-gray-500">{item.time}</p>
                    </div>
                    {item.status === 'completed' && (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
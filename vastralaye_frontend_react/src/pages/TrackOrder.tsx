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
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="overline-label mb-2">Order status</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso mb-2">Track Your Order</h1>
          <p className="text-muted-foreground">Real-time updates for your delivery</p>
        </div>

        {/* Search Card */}
        <div className="bg-white border border-border rounded-sm p-6 mb-6">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter your order ID..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-input rounded-sm text-sm text-espresso placeholder:text-muted-foreground focus:outline-none focus:border-maroon transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 bg-maroon text-ivory text-xs font-semibold uppercase tracking-[0.16em] rounded-sm hover:bg-terracotta transition-colors disabled:bg-sand disabled:text-muted-foreground disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            <div className="bg-white border border-border rounded-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg font-medium text-espresso">Delivery Progress</h3>
                <span className="px-3 py-1 bg-gold/15 text-espresso text-[11px] font-semibold uppercase tracking-[0.12em] rounded-sm">
                  {trackingInfo.status.replace(/-/g, ' ').toUpperCase()}
                </span>
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-xs uppercase tracking-[0.08em] text-muted-foreground mb-2">
                  <span>Order Placed</span>
                  <span>Delivered</span>
                </div>
                <div className="w-full bg-sand rounded-full h-1.5">
                  <div
                    className="bg-gold h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${trackingInfo.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">Estimated arrival in</p>
                <p className="font-serif text-2xl font-medium text-espresso">{trackingInfo.estimatedArrival}</p>
              </div>
            </div>

            {/* Driver Info */}
            <div className="bg-white border border-border rounded-sm p-6">
              <h3 className="font-serif text-lg font-medium text-espresso mb-4">Your Delivery Agent</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blush rounded-full flex items-center justify-center">
                  <span className="font-serif text-maroon font-medium">
                    {trackingInfo.driver.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-espresso">{trackingInfo.driver.name}</p>
                  <p className="text-sm text-muted-foreground">{trackingInfo.driver.vehicle}</p>
                </div>
                <a
                  href={`tel:${trackingInfo.driver.phone}`}
                  className="px-5 py-2.5 border border-espresso text-espresso text-xs font-semibold uppercase tracking-[0.16em] rounded-sm hover:bg-espresso hover:text-ivory transition-colors"
                >
                  Call
                </a>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-border rounded-sm p-6">
              <h3 className="font-serif text-lg font-medium text-espresso mb-4">Delivery Timeline</h3>
              <div className="space-y-4">
                {trackingInfo.timeline.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      item.status === 'completed' ? 'bg-gold' :
                      item.status === 'current' ? 'bg-maroon' : 'bg-border'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium text-espresso">{item.event}</p>
                      <p className="text-sm text-muted-foreground">{item.time}</p>
                    </div>
                    {item.status === 'completed' && (
                      <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
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

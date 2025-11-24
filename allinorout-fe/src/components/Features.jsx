import { FiStar, FiShield, FiUsers, FiHeart } from 'react-icons/fi';

const Features = () => {
  const features = [
    {
      icon: <FiStar className="w-12 h-12 text-blue-600" />,
      title: "4.9/5 Rating",
      subtitle: "CUSTOMER SATISFACTION",
      description: "Rated as the top moving platform with thousands of satisfied customers."
    },
    {
      icon: <FiShield className="w-12 h-12 text-blue-600" />,
      title: "Vetted Movers",
      subtitle: "100% VERIFIED",
      description: "All our professional movers are background checked and fully insured."
    },
    {
      icon: <FiUsers className="w-12 h-12 text-blue-600" />,
      title: "Simple Booking",
      subtitle: "NO SEARCHING REQUIRED",
      description: "We handle the mover matching - you just fill out one form and relax."
    },
    {
      icon: <FiHeart className="w-12 h-12 text-blue-600" />,
      title: "Customer First",
      subtitle: "99% SATISFACTION",
      description: "Our customers love our simple, reliable approach to moving."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-blue-600 font-semibold mb-3">
                {feature.subtitle}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

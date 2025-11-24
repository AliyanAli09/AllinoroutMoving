import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiTruck, FiUser, FiPhone, FiCreditCard, FiCheck, FiMail } from 'react-icons/fi';
import { bookingsService } from '../services';
import PaymentForm from '../components/PaymentForm';

const CreateBookingSimple = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingCreated, setBookingCreated] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState(null);

  const [formData, setFormData] = useState({
    // Contact Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',

    // Move Details
    moveDate: '',
    moveTime: '09:00',

    // Type of Move
    moveType: 'apartment', // apartment, house, office
    bedrooms: '2', // 1, 2, 3, 4, 5+

    // Pickup & Dropoff Addresses
    pickupAddress: '',
    dropoffAddress: '',

    // Services
    needPackingHelp: false,
    needBoxesSupplied: false,
    anyStairs: false,

    // Special Items
    specialItems: ''
  });

  const formatPhoneNumber = (value) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Special handling for phone number to auto-format
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's 10 digits (US format)
    return cleaned.length === 10;
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        setError('Please fill in all required fields');
        return false;
      }
      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      if (!validatePhone(formData.phone)) {
        setError('Please enter a valid 10-digit US phone number');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.moveDate || !formData.pickupAddress || !formData.dropoffAddress) {
        setError('Please fill in all required fields');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setLoading(true);
      setError('');

      // Transform data to match backend API
      const bookingData = {
        customerInfo: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone
        },
        moveDate: formData.moveDate,
        moveTime: formData.moveTime,
        moveType: 'residential',
        homeSize: `${formData.bedrooms}-bedroom`,
        estimatedDuration: 2,
        pickupAddress: {
          street: formData.pickupAddress,
          city: 'Las Vegas',
          state: 'NV',
          zipCode: '89101',
          stairs: formData.anyStairs ? 10 : 0,
          elevator: false,
          notes: formData.specialItems || ''
        },
        dropoffAddress: {
          street: formData.dropoffAddress,
          city: 'Las Vegas',
          state: 'NV',
          zipCode: '89102',
          stairs: formData.anyStairs ? 10 : 0,
          elevator: false,
          notes: ''
        },
        servicesRequested: [
          'full-service',
          ...(formData.needPackingHelp ? ['packing'] : []),
          ...(formData.needBoxesSupplied ? ['packing'] : []) // Map boxes to packing service
        ],
        packingRequired: formData.needPackingHelp || formData.needBoxesSupplied,
        items: [],
        specialInstructions: formData.specialItems || ''
      };

      const response = await bookingsService.createBooking(bookingData);
      console.log('📦 Full booking response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response data.data:', response.data?.data);
      console.log('📦 Response data.data.booking:', response.data?.data?.booking);

      // The response structure is: response.data.data.booking._id
      const bookingId = response.data?.data?.booking?._id || response.data?.data?._id || response.data?._id;
      console.log('📦 Extracted booking ID:', bookingId);

      if (!bookingId) {
        throw new Error('Failed to get booking ID from response');
      }

      setCreatedBookingId(bookingId);
      setBookingCreated(true);
      setCurrentStep(3); // Move to payment step
    } catch (err) {
      console.error('Booking creation error:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    navigate(`/booking-confirmation/${createdBookingId}`);
  };

  const steps = [
    { number: 1, title: 'Contact Info', icon: FiUser },
    { number: 2, title: 'Move Details', icon: FiTruck },
    { number: 3, title: 'Payment', icon: FiCreditCard }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                    currentStep >= step.number
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number ? 'text-primary-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 rounded ${
                    currentStep > step.number ? 'bg-primary-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Contact Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Information</h2>
                <p className="text-gray-600">Let us know how to reach you</p>
              </div>

              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (USA) *
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                    maxLength="14"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">Format: (555) 123-4567 or 5551234567</p>
              </div>

              <button
                onClick={() => {
                  if (validateStep()) handleNext();
                }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
              >
                Continue
                <FiCheck className="ml-2" />
              </button>
            </div>
          )}

          {/* Step 2: Move Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Move Details</h2>
                <p className="text-gray-600">Tell us about your move</p>
              </div>

              {/* Move Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Move Date *
                  </label>
                  <input
                    type="date"
                    name="moveDate"
                    value={formData.moveDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <select
                    name="moveTime"
                    value={formData.moveTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Address *
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={handleInputChange}
                    placeholder="123 Main Street, Las Vegas, NV"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drop-off Address *
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="dropoffAddress"
                    value={formData.dropoffAddress}
                    onChange={handleInputChange}
                    placeholder="456 Oak Avenue, Las Vegas, NV"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Type of Move */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type of Move *
                </label>
                <select
                  name="moveType"
                  value={formData.moveType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="office">Office</option>
                </select>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Bedrooms *
                </label>
                <select
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5+ Bedrooms</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-300 rounded-xl hover:border-primary-500 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="needPackingHelp"
                    checked={formData.needPackingHelp}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Need Packing Help?</span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-300 rounded-xl hover:border-primary-500 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="needBoxesSupplied"
                    checked={formData.needBoxesSupplied}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Need Boxes Supplied?</span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-300 rounded-xl hover:border-primary-500 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="anyStairs"
                    checked={formData.anyStairs}
                    onChange={handleInputChange}
                    className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700 font-medium">Any Stairs?</span>
                </label>
              </div>

              {/* Special Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Items (Optional)
                </label>
                <textarea
                  name="specialItems"
                  value={formData.specialItems}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Piano, antiques, fragile items, etc."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                  <FiCheck className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && bookingCreated && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h2>
                <p className="text-gray-600">Pay your deposit to confirm your booking</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Booking Summary</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Customer:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  <p><strong>Date:</strong> {formData.moveDate} at {formData.moveTime}</p>
                  <p><strong>Type:</strong> {formData.moveType.charAt(0).toUpperCase() + formData.moveType.slice(1)} ({formData.bedrooms} bedroom{formData.bedrooms !== '1' ? 's' : ''})</p>
                  <p><strong>From:</strong> {formData.pickupAddress}</p>
                  <p><strong>To:</strong> {formData.dropoffAddress}</p>
                  {formData.needPackingHelp && <p>✓ Packing Help Requested</p>}
                  {formData.needBoxesSupplied && <p>✓ Boxes Supplied</p>}
                  {formData.anyStairs && <p>⚠ Stairs Present</p>}
                </div>
              </div>

              <PaymentForm
                bookingId={createdBookingId}
                amount={15000} // $150.00 deposit
                onSuccess={handlePaymentSuccess}
                isGuest={true}
                guestEmail={formData.email.trim().toLowerCase()}
              />

              <button
                onClick={handleBack}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Back to Edit
              </button>
            </div>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="flex items-center justify-center">
            <FiCheck className="text-green-600 mr-2" />
            Licensed & Insured Movers
          </p>
          <p className="mt-2">📍 Serving Las Vegas, Nevada</p>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingSimple;

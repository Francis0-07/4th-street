const Privacy = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Legal</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Privacy Policy
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            Your privacy is important to us. Here is how we handle your data.
          </p>
        </div>
        <div className="mt-16 prose prose-indigo prose-lg text-gray-500 mx-auto max-w-3xl">
            <h3>1. Information We Collect</h3>
            <p>
                We collect information you provide directly to us, such as when you create an account, make a purchase, or contact customer support. This may include your name, email address and shipping address.
            </p>
            <h3>2. How We Use Your Information</h3>
            <p>
                We use the information we collect to process your orders, communicate with you, improve our services, and prevent fraud.
            </p>
            <h3>3. Sharing of Information</h3>
            <p>
                We do not sell your personal information. We may share your information with third-party service providers who assist us in operating our website and conducting our business, such as payment processors and shipping carriers.
            </p>
            <h3>4. Security</h3>
            <p>
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
            </p>
            <h3>5. Contact Us</h3>
            <p>
                If you have any questions about this Privacy Policy, please contact us at support@4th-street.com.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
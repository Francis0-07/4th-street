const About = () => {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">About Us</h2>
          <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Our Story
          </p>
          <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
            4th-street is a premium menswear brand dedicated to timeless elegance and modern minimalism.
          </p>
        </div>
        <div className="mt-16">
            <div className="prose prose-indigo prose-lg text-gray-500 mx-auto max-w-3xl">
                <p className="mb-4">
                    Founded with a vision to redefine modern menswear, 4th-street bridges the gap between classic tailoring and contemporary street style. We believe that style should be effortless, and quality should never be compromised.
                </p>
                <p className="mb-4">
                    Our collections are curated with the finest materials, ensuring that every piece you wear feels as good as it looks. From our signature suits to our casual essentials, every item tells a story of craftsmanship and dedication.
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h3>
                <p>
                    To empower individuals to express their unique identity through sophisticated, minimalist fashion. We strive to create clothing that inspires confidence and stands the test of time.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default About;
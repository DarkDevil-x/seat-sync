export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "SeatSync made booking concert tickets so much easier. I could see exactly which seats were available in real-time!",
      author: "Sarah Johnson",
      role: "Music Fan",
    },
    {
      quote:
        "As an event organizer, the admin dashboard gives me complete control over my events. The real-time updates are a game changer.",
      author: "Michael Chen",
      role: "Event Organizer",
    },
    {
      quote:
        "I love how easy it is to find and book events. The seat selection interface is intuitive and the whole process is seamless.",
      author: "Priya Patel",
      role: "Theater Enthusiast",
    },
  ];

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="container max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">Thousands</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            See what our community has to say about their experience with SeatSync.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group flex flex-col gap-5 rounded-2xl border border-border bg-card p-7 relative shadow-sm hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg transition-all duration-200 animate-fadeIn"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array(5).fill(0).map((_, i) => (
                  <svg key={i} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote>
                <p className="text-sm text-muted-foreground leading-relaxed">"{testimonial.quote}"</p>
              </blockquote>
              <footer className="flex items-center gap-3 mt-auto">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <cite className="not-italic text-sm font-semibold text-foreground block">{testimonial.author}</cite>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </footer>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

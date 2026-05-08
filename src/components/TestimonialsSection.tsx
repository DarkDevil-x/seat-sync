
export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "EventHub made booking concert tickets so much easier. I could see exactly which seats were available in real-time!",
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
              className="bg-white/50 dark:bg-card/40 p-8 rounded-3xl border border-slate-200 dark:border-white/10 relative shadow-lg shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform duration-300 backdrop-blur-sm"
            >
              <div className="absolute -top-5 -left-1 text-7xl text-purple-500/20 dark:text-purple-500/20 font-serif">
                "
              </div>
              <blockquote className="relative z-10">
                <p className="mb-6 text-lg font-medium text-foreground leading-relaxed">{testimonial.quote}</p>
                <footer className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <cite className="not-italic font-bold text-foreground block">
                      {testimonial.author}
                    </cite>
                    <p className="text-sm text-muted-foreground font-medium">
                      {testimonial.role}
                    </p>
                  </div>
                </footer>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

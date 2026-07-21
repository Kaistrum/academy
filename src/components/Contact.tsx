import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WordsReveal } from "@kaistrum/stratum-ui";

export default function Contact() {
	const sectionRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

	const [form, setForm] = useState({
		name: "",
		email: "",
		organisation: "",
		message: ""
	});
	const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
		"idle"
	);

	function handleChange(
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) {
		setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setStatus("sending");
		try {
			const res = await fetch("https://formspree.io/f/your-form-id", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				},
				body: JSON.stringify(form)
			});
			if (res.ok) {
				setStatus("sent");
				setForm({ name: "", email: "", organisation: "", message: "" });
			} else {
				setStatus("error");
			}
		} catch {
			setStatus("error");
		}
	}

	const inputStyle = {
		background: "var(--bg-surface)",
		border: "1px solid var(--border)",
		color: "var(--text)",
		borderRadius: "0",
		padding: "0.875rem 1rem",
		fontSize: "0.875rem",
		width: "100%",
		outline: "none",
		transition: "border-color 0.2s"
	} as React.CSSProperties;

	return (
		<section
			id="teams"
			className="py-20 md:py-32 px-4 md:px-6"
			style={{ background: "var(--bg)" }}>
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="text-center mb-14 md:mb-20">
					<p
						className="text-[10px] sm:text-xs uppercase tracking-[0.22em] mb-5 font-medium"
						style={{ color: "var(--accent)" }}>
						Contact
					</p>
					<div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] max-w-3xl mx-auto">
						<WordsReveal
							justify="center"
							segments={[
								{
									text: "Let's map",
									className: "font-semibold",
									style: { color: "var(--text)" }
								},
								{
									text: " your next project.",
									className: "font-normal italic",
									style: {
										fontFamily: "'Instrument Serif', serif",
										color: "var(--text-dim)"
									}
								}
							]}
						/>
					</div>
					<p
						className="text-sm md:text-base mt-5 max-w-lg mx-auto leading-relaxed"
						style={{ color: "var(--text-dim)" }}>
						Tell us about your organisation and GIS needs — we'll show you how
						Kaistrum fits.
					</p>
				</div>

				<motion.div
					ref={sectionRef}
					className="grid grid-cols-1 lg:grid-cols-5 gap-5"
					initial={{ opacity: 0, y: 32 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}>
					{/* Info panel */}
					<div
						className="lg:col-span-2 p-8 md:p-10 flex flex-col justify-between gap-10 border"
						style={{
							background: "var(--bg-surface)",
							borderColor: "var(--border)"
						}}>
						<div>
							<div className="flex items-center gap-2.5 mb-3">
								<Image
									src="/logo.png"
									alt=""
									height={26}
									width={28}
									className="object-contain"
								/>
								<span
									className="text-xs font-bold tracking-widest uppercase"
									style={{ color: "var(--text)" }}>
									Kaistrum
								</span>
							</div>
							<p
								className="text-sm leading-relaxed"
								style={{ color: "var(--text-dim)" }}>
								Trusted by governments, utilities, and organisations across 180+
								countries.
							</p>
						</div>

						<div className="flex flex-col gap-5">
							<div>
								<p
									className="text-[10px] uppercase tracking-[0.18em] mb-1.5 font-medium"
									style={{ color: "var(--accent)" }}>
									Email
								</p>
								<a
									href="mailto:hello@kaistrum.com"
									className="text-sm transition-colors duration-200"
									style={{ color: "var(--text-dim)" }}
									onMouseEnter={(e) =>
										((e.currentTarget as HTMLElement).style.color =
											"var(--accent)")
									}
									onMouseLeave={(e) =>
										((e.currentTarget as HTMLElement).style.color =
											"var(--text-dim)")
									}>
									hello@kaistrum.com
								</a>
							</div>
							<div>
								<p
									className="text-[10px] uppercase tracking-[0.18em] mb-1.5 font-medium"
									style={{ color: "var(--accent)" }}>
									Response time
								</p>
								<p className="text-sm" style={{ color: "var(--text-dim)" }}>
									Within 1 business day
								</p>
							</div>
							<div>
								<p
									className="text-[10px] uppercase tracking-[0.18em] mb-1.5 font-medium"
									style={{ color: "var(--accent)" }}>
									Headquarters
								</p>
								<p className="text-sm" style={{ color: "var(--text-dim)" }}>
									Upperhill, Nairobi
								</p>
							</div>
						</div>

						{/* Grid decoration */}
						<svg
							className="w-full opacity-[0.06] pointer-events-none"
							viewBox="0 0 200 60"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden="true">
							<defs>
								<pattern
									id="contact-grid"
									width="20"
									height="20"
									patternUnits="userSpaceOnUse">
									<path
										d="M 20 0 L 0 0 0 20"
										fill="none"
										stroke="currentColor"
										strokeWidth="0.5"
									/>
								</pattern>
							</defs>
							<rect
								width="200"
								height="60"
								fill="url(#contact-grid)"
								style={{ color: "var(--accent)" }}
							/>
						</svg>
					</div>

					{/* Form */}
					<div
						className="lg:col-span-3 p-8 md:p-10 border"
						style={{
							background: "var(--bg-surface)",
							borderColor: "var(--border)"
						}}>
						{status === "sent" ? (
							<div className="h-full flex flex-col items-center justify-center text-center gap-4 py-12">
								<div
									className="w-12 h-12 flex items-center justify-center mb-2"
									style={{ background: "var(--accent-faint)" }}>
									<ArrowRight size={20} style={{ color: "var(--accent)" }} />
								</div>
								<p
									className="font-semibold text-lg"
									style={{ color: "var(--text)" }}>
									Message sent!
								</p>
								<p
									className="text-sm max-w-xs"
									style={{ color: "var(--text-muted)" }}>
									Thanks for reaching out. We'll be in touch within one business
									day.
								</p>
								<button
									onClick={() => setStatus("idle")}
									className="mt-4 text-xs transition-colors duration-200"
									style={{ color: "var(--text-muted)" }}>
									Send another message
								</button>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="flex flex-col gap-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="flex flex-col gap-1.5">
										<label
											className="text-[10px] uppercase tracking-[0.16em] font-medium"
											style={{ color: "var(--text-muted)" }}>
											Name
										</label>
										<input
											name="name"
											type="text"
											required
											placeholder="Jane Doe"
											value={form.name}
											onChange={handleChange}
											style={inputStyle}
											onFocus={(e) =>
												(e.currentTarget.style.borderColor = "var(--accent)")
											}
											onBlur={(e) =>
												(e.currentTarget.style.borderColor = "var(--border)")
											}
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<label
											className="text-[10px] uppercase tracking-[0.16em] font-medium"
											style={{ color: "var(--text-muted)" }}>
											Organisation
										</label>
										<input
											name="organisation"
											type="text"
											placeholder="City Council / Utility Ltd."
											value={form.organisation}
											onChange={handleChange}
											style={inputStyle}
											onFocus={(e) =>
												(e.currentTarget.style.borderColor = "var(--accent)")
											}
											onBlur={(e) =>
												(e.currentTarget.style.borderColor = "var(--border)")
											}
										/>
									</div>
								</div>

								<div className="flex flex-col gap-1.5">
									<label
										className="text-[10px] uppercase tracking-[0.16em] font-medium"
										style={{ color: "var(--text-muted)" }}>
										Email
									</label>
									<input
										name="email"
										type="email"
										required
										placeholder="jane@organisation.com"
										value={form.email}
										onChange={handleChange}
										style={inputStyle}
										onFocus={(e) =>
											(e.currentTarget.style.borderColor = "var(--accent)")
										}
										onBlur={(e) =>
											(e.currentTarget.style.borderColor = "var(--border)")
										}
									/>
								</div>

								<div className="flex flex-col gap-1.5">
									<label
										className="text-[10px] uppercase tracking-[0.16em] font-medium"
										style={{ color: "var(--text-muted)" }}>
										Message
									</label>
									<textarea
										name="message"
										required
										rows={5}
										placeholder="Tell us about your GIS requirements, current setup, and what you'd like to achieve."
										value={form.message}
										onChange={handleChange}
										style={{ ...inputStyle, resize: "none" }}
										onFocus={(e) =>
											(e.currentTarget.style.borderColor = "var(--accent)")
										}
										onBlur={(e) =>
											(e.currentTarget.style.borderColor = "var(--border)")
										}
									/>
								</div>

								{status === "error" && (
									<p className="text-red-400 text-xs">
										Something went wrong. Try emailing us at hello@kaistrum.com.
									</p>
								)}

								<button
									type="submit"
									disabled={status === "sending"}
									className="group self-start inline-flex items-center gap-2 pl-5 pr-1.5 py-1.5 font-semibold text-sm transition-all duration-200 hover:gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
									style={{ background: "var(--accent)", color: "var(--bg)" }}>
									{status === "sending" ? "Sending…" : "Send message"}
									<span
										className="w-9 h-9 flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0"
										style={{ background: "var(--bg)", color: "var(--accent)" }}>
										<ArrowRight size={15} />
									</span>
								</button>
							</form>
						)}
					</div>
				</motion.div>
			</div>
		</section>
	);
}

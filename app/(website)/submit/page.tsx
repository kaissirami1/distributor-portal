"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/site";
import { Button, Card, Field, PageHeader, SelectField, TextAreaField } from "@/components/ui";

// The page title is set in ./layout.tsx (this file runs in the browser, so it can't set it)

// Uploads larger than this are rejected before sending (the host limits uploads to about 4.5 MB)
const MAX_FILE_MB = 4;

// An error whose message is safe to show to the vendor as-is
class FormError extends Error {}

async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
        throw new FormError(`We couldn't upload "${file.name}". Please try again, or paste a link to the file instead.`);
    }
    const data = await res.json();
    return data.url;
}

export default function SubmitPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        const fd = new FormData(e.currentTarget);

        // Check file sizes before uploading anything
        for (const value of fd.values()) {
            if (value instanceof File && value.size > MAX_FILE_MB * 1024 * 1024) {
                setError(`"${value.name}" is too large. Files must be under ${MAX_FILE_MB} MB.`);
                return;
            }
        }

        setLoading(true);
        setError("");

        try {
            // Use the uploaded file if one was picked, otherwise the pasted link / number
            async function fileOrText(fileField: string, textField: string) {
                const file = fd.get(fileField) as File | null;
                return file?.size ? uploadFile(file) : (fd.get(textField) as string) || "";
            }
            const imageUrl = await fileOrText("imageFile", "imageUrl");
            const documentsUrl = await fileOrText("documentsFile", "documentsUrl");
            const barcode = await fileOrText("barcodeFile", "barcode");

            // Send every text field in the form, by its name
            const textFields = Object.fromEntries(
                [...fd.entries()].filter(([, value]) => typeof value === "string")
            );

            const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...textFields, imageUrl, documentsUrl, barcode }),
            });
            if (!res.ok) throw new Error("Submission failed");

            const { trackingId } = await res.json();
            router.push(trackingId ? `/thank-you?id=${encodeURIComponent(trackingId)}` : "/thank-you");
        } catch (err) {
            console.error(err);
            setError(err instanceof FormError ? err.message : "Something went wrong. Please try again.");
            setLoading(false);
        }
    }

    return (
        <>
            <PageHeader
                eyebrow="Product Application"
                title="Submit Your Product"
                text="Share your product information, supporting documents, images, and barcode details for distribution review."
            />

            <section className="px-6 pb-20">
                <Card className="max-w-5xl mx-auto shadow-2xl">
                    <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10">
                        <FormSection title="Contact Information" text="Tell us who is submitting the product.">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Field label="Full Name" name="name" required autoComplete="name" />
                                <Field label="Email" name="email" type="email" required autoComplete="email" />
                                <Field label="Phone Number" name="phone" type="tel" autoComplete="tel" />
                                <Field label="Company Name" name="companyName" autoComplete="organization" />
                            </div>
                        </FormSection>

                        <FormSection
                            title="Product Details"
                            text="Include the product name, category, minimum order, and any link that helps us understand the item."
                        >
                            <div className="grid md:grid-cols-2 gap-4">
                                <Field label="Product Name" name="productName" required />
                                <SelectField
                                    label="Category"
                                    name="category"
                                    placeholder="Choose a category"
                                    options={[...categories, "Other"]}
                                />
                                <Field label="Minimum Order / MOQ" name="minimumOrder" placeholder="e.g. 24 units" />
                                <Field label="Cost per Unit" name="cost" placeholder="e.g. $4.99" />
                                <Field label="Product Website / URL" name="productUrl" type="url" placeholder="https://" />
                            </div>
                        </FormSection>

                        <FormSection
                            title="Uploads & Supporting Files"
                            text={`Upload product images, spec sheets, sell sheets, Excel files, or barcode files (up to ${MAX_FILE_MB} MB each). You may also paste links if files are already hosted online.`}
                        >
                            <div className="grid gap-5">
                                <UploadBox
                                    label="Product Image"
                                    fileName="imageFile"
                                    accept="image/*"
                                    textName="imageUrl"
                                    textLabel="Or paste an image link"
                                />
                                <UploadBox
                                    label="Documents"
                                    hint="PDF, Excel, CSV, Word, image files, spec sheets, sell sheets"
                                    fileName="documentsFile"
                                    accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,image/*"
                                    textName="documentsUrl"
                                    textLabel="Or paste a document link"
                                />
                                <UploadBox
                                    label="Barcode / UPC"
                                    hint="Upload a barcode image or PDF, or type the UPC number."
                                    fileName="barcodeFile"
                                    accept="image/*,.pdf"
                                    textName="barcode"
                                    textLabel="Or type the barcode / UPC number"
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Target Location" text="Tell us where you are hoping to distribute or sell this product.">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Field label="City" name="city" />
                                <Field label="County" name="county" />
                            </div>
                        </FormSection>

                        <FormSection title="Additional Notes">
                            <TextAreaField
                                label="Anything else we should know?"
                                name="notes"
                                placeholder="Product details, retail goals, distribution needs, or special notes..."
                            />
                        </FormSection>

                        {error && (
                            <p role="alert" className="text-red-400 text-sm text-center">{error}</p>
                        )}

                        <div className="border-t border-gold/10 pt-6">
                            <Button type="submit" size="lg" disabled={loading} className="w-full">
                                {loading ? "Submitting..." : "Submit Application"}
                            </Button>
                            <p className="text-xs text-stone-500 text-center mt-4">
                                All submissions are reviewed before any distribution decision is made.
                            </p>
                        </div>
                    </form>
                </Card>
            </section>
        </>
    );
}

// One titled part of the form
function FormSection({ title, text, children }: { title: string; text?: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="text-2xl font-semibold text-gold-light mb-2">{title}</h2>
            {text && <p className="text-stone-400 mb-5">{text}</p>}
            {children}
        </section>
    );
}

// A box with a file picker plus a text box for pasting a link instead
function UploadBox({
    label,
    hint,
    fileName,
    accept,
    textName,
    textLabel,
}: {
    label: string;
    hint?: string;
    fileName: string;
    accept: string;
    textName: string;
    textLabel: string;
}) {
    return (
        <div className="rounded-2xl border border-gold/10 bg-black/30 p-5 space-y-3">
            <Field label={label} hint={hint} name={fileName} type="file" accept={accept} />
            <Field label={textLabel} name={textName} />
        </div>
    );
}

"use client";

export default function DeleteButton() {
    return (
        <button
            onClick={(e) => {
                if (!confirm("Are you sure you want to delete this submission?")) {
                    e.preventDefault();
                }
            }}
            className="bg-red-900 text-white px-2 py-1 rounded"
        >
            Delete
        </button>
    );
}
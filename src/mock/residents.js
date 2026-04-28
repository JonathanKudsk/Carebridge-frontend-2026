export const residents = [
    {
        id: 1,
        firstName: "Mariam",
        lastName: "Elmir",
        medicalData: {
            medications: [
                { name: "Panodil", dosage: "500mg", time: "08:00" },
                { name: "Ibuprofen", dosage: "200mg", time: "12:00" }
            ],
            allergies: ["Peanuts"],
            notes: "Needs assistance with medication"
        }
    },
    {
        id: 2,
        firstName: "Jonas",
        lastName: "Hansen",
        medicalData: {
            medications: [
                { name: "Insulin", dosage: "10 units", time: "Morning" }
            ],
            allergies: [],
            notes: "Diabetic"
        }
    }
];
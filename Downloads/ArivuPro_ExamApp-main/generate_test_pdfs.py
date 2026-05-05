"""
Generate 3 test PDFs for AI evaluation testing:
  1. question_paper.pdf     - 5 exam questions
  2. suggested_answers.pdf  - model answers
  3. student_answers.pdf    - student sheet with deliberate errors
"""

from fpdf import FPDF


EXAM_TITLE = "General Science & Knowledge - Class 10"
SUBJECT = "Science & General Studies"
MAX_MARKS = 25
DATE = "04 May 2026"
TIME = "1 Hour"


QUESTIONS = [
    {
        "no": 1,
        "text": "What is the chemical formula of water? Explain why water is called a universal solvent.",
        "marks": 5,
    },
    {
        "no": 2,
        "text": "State Newton's Second Law of Motion and write its mathematical expression. Give one real-life example.",
        "marks": 5,
    },
    {
        "no": 3,
        "text": "What is photosynthesis? Write the overall chemical equation for photosynthesis and name the organelle responsible for it.",
        "marks": 5,
    },
    {
        "no": 4,
        "text": "A train travels 150 km in 2.5 hours. Calculate its average speed in km/h and convert it to m/s.",
        "marks": 5,
    },
    {
        "no": 5,
        "text": "Differentiate between conductor and insulator. Give two examples of each and explain how electrons behave differently in them.",
        "marks": 5,
    },
]

MODEL_ANSWERS = [
    {
        "no": 1,
        "answer": (
            "The chemical formula of water is H2O (two hydrogen atoms bonded to one oxygen atom).\n\n"
            "Water is called a universal solvent because it can dissolve more substances than any other liquid. "
            "This is due to its polar nature - the oxygen end carries a partial negative charge and each hydrogen end "
            "carries a partial positive charge. These polar ends attract the charged ions of ionic compounds and the "
            "polar regions of other molecules, pulling them apart and surrounding them (hydration). "
            "Hence water effectively dissolves salts, sugars, acids, and many other substances."
        ),
        "marks": 5,
    },
    {
        "no": 2,
        "answer": (
            "Newton's Second Law of Motion states: The rate of change of momentum of a body is directly proportional "
            "to the applied force and takes place in the direction of the force.\n\n"
            "Mathematical expression:  F = ma\n"
            "where F = net force (N), m = mass (kg), a = acceleration (m/s^2).\n\n"
            "Real-life example: When a cricket ball is hit by a bat, the large force applied by the bat gives the "
            "ball a large acceleration, sending it at high speed. The heavier the bat swing, the faster the ball travels."
        ),
        "marks": 5,
    },
    {
        "no": 3,
        "answer": (
            "Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to "
            "produce glucose and oxygen.\n\n"
            "Overall chemical equation:\n"
            "6CO2 + 6H2O  --(sunlight/chlorophyll)-->  C6H12O6 + 6O2\n\n"
            "The organelle responsible for photosynthesis is the Chloroplast. "
            "It contains the green pigment chlorophyll, which absorbs light energy to drive the reaction."
        ),
        "marks": 5,
    },
    {
        "no": 4,
        "answer": (
            "Given: Distance = 150 km,  Time = 2.5 hours\n\n"
            "Average speed = Distance / Time\n"
            "             = 150 / 2.5\n"
            "             = 60 km/h\n\n"
            "Conversion to m/s:\n"
            "60 km/h = 60 * (1000 m / 3600 s)\n"
            "        = 60000 / 3600\n"
            "        = 16.67 m/s  (approx.)\n\n"
            "Therefore, the average speed is 60 km/h or approximately 16.67 m/s."
        ),
        "marks": 5,
    },
    {
        "no": 5,
        "answer": (
            "Conductor: A material that allows electric current (free electrons) to flow through it easily.\n"
            "Examples: Copper, Aluminium\n"
            "Electrons in conductors are loosely bound to atoms and move freely throughout the material, "
            "enabling easy flow of charge.\n\n"
            "Insulator: A material that does not allow electric current to flow through it.\n"
            "Examples: Rubber, Glass\n"
            "Electrons in insulators are tightly bound to their atoms and cannot move freely. "
            "Therefore, charge cannot flow, making them poor conductors of electricity.\n\n"
            "Key difference: Conductors have free electrons (delocalised), insulators do not."
        ),
        "marks": 5,
    },
]

# Student answers with deliberate errors in Q2, Q3, Q4, Q5
STUDENT_ANSWERS = [
    {
        "no": 1,
        "answer": (
            "The chemical formula of water is H2O.\n\n"
            "Water is called a universal solvent because it can dissolve many substances. "
            "Water has positive and negative ends which attract other molecules and dissolve them. "
            "That is why it is used in labs and in daily life for mixing things."
        ),
    },
    {
        "no": 2,
        # WRONG: F = m + a instead of F = ma
        "answer": (
            "Newton's Second Law says that force is equal to mass plus acceleration.\n\n"
            "Mathematical expression:  F = m + a\n\n"
            "Example: When we push a heavy box it moves slowly, but a lighter box moves faster "
            "because it has less mass."
        ),
    },
    {
        "no": 3,
        # WRONG: Mitochondria instead of Chloroplast
        "answer": (
            "Photosynthesis is the process by which plants prepare their own food using sunlight and water.\n\n"
            "Chemical equation:\n"
            "6CO2 + 6H2O --> C6H12O6 + 6O2\n\n"
            "The organelle responsible is the Mitochondria."
        ),
    },
    {
        "no": 4,
        # WRONG: divides by 60 instead of 3600 giving 1000 m/s
        "answer": (
            "Distance = 150 km,  Time = 2.5 hours\n\n"
            "Average speed = Distance / Time = 150 / 2.5 = 60 km/h\n\n"
            "Conversion to m/s:\n"
            "60 km/h = 60 * 1000 / 60\n"
            "        = 1000 m/s\n\n"
            "Therefore, the average speed is 60 km/h or 1000 m/s."
        ),
    },
    {
        "no": 5,
        # WRONG: conductor/insulator examples are swapped
        "answer": (
            "Conductor: A material that allows electricity to flow.\n"
            "Examples: Rubber, Wood\n\n"
            "Insulator: A material that does not allow electricity to flow.\n"
            "Examples: Copper, Iron\n\n"
            "In conductors electrons move freely. In insulators electrons are fixed."
        ),
    },
]


# ---------------------------------------------------------------------------

class ExamPDF(FPDF):
    def __init__(self, doc_title):
        super().__init__()
        self.doc_title = doc_title

    def header(self):
        self.set_font("Helvetica", "B", 13)
        self.cell(0, 8, "ARIVUPRO ACADEMY", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "B", 11)
        self.cell(0, 7, EXAM_TITLE, align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.cell(0, 5, self.doc_title, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        self.set_draw_color(0, 0, 0)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 5, f"Page {self.page_no()}", align="C")
        self.set_text_color(0, 0, 0)

    def meta_row(self):
        self.set_font("Helvetica", "", 10)
        self.cell(95, 6, f"Subject: {SUBJECT}", new_x="RIGHT", new_y="TOP")
        self.cell(0, 6, f"Date: {DATE}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.cell(95, 6, f"Max Marks: {MAX_MARKS}", new_x="RIGHT", new_y="TOP")
        self.cell(0, 6, f"Time: {TIME}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.ln(3)


# ---------------------------------------------------------------------------

def build_question_paper(path):
    pdf = ExamPDF("Question Paper")
    pdf.add_page()
    pdf.meta_row()

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, "Instructions: Answer ALL questions. Each question carries 5 marks.",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    for q in QUESTIONS:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, f"Q{q['no']}.  [{q['marks']} Marks]", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 11)
        pdf.multi_cell(0, 6, q["text"])
        pdf.ln(6)

    pdf.output(path)
    print(f"  Created: {path}")


def build_suggested_answers(path):
    pdf = ExamPDF("Suggested Answers (Model Answer Key)")
    pdf.add_page()
    pdf.meta_row()

    for ans in MODEL_ANSWERS:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7,
                 f"Q{ans['no']}  [{ans['marks']} Marks]  - Model Answer",
                 new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, ans["answer"])
        pdf.ln(5)
        pdf.set_draw_color(180, 180, 180)
        pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
        pdf.ln(4)
        pdf.set_draw_color(0, 0, 0)

    pdf.output(path)
    print(f"  Created: {path}")


def build_student_answers(path):
    pdf = ExamPDF("Student Answer Sheet")
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(60, 7, "Student Name:", new_x="RIGHT", new_y="TOP")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, "Ravi Kumar", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(60, 7, "Roll Number:", new_x="RIGHT", new_y="TOP")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, "2024-CS-042", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.multi_cell(0, 5,
        "Note: This is a student-submitted answer sheet generated for AI evaluation testing. "
        "Some answers contain deliberate errors to verify AI feedback accuracy.")
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(5)

    for ans in STUDENT_ANSWERS:
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(0, 7, f"Answer {ans['no']}:", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 6, ans["answer"])
        pdf.ln(6)

    pdf.output(path)
    print(f"  Created: {path}")


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import os
    out_dir = os.path.join(os.path.dirname(__file__), "test_pdfs")
    os.makedirs(out_dir, exist_ok=True)

    print("Generating test PDFs...")
    build_question_paper(os.path.join(out_dir, "question_paper.pdf"))
    build_suggested_answers(os.path.join(out_dir, "suggested_answers.pdf"))
    build_student_answers(os.path.join(out_dir, "student_answers.pdf"))

    print("\nDone! All 3 PDFs saved to: test_pdfs/")
    print("\nDeliberate errors planted in student_answers.pdf:")
    print("  Q2 - Formula error: wrote F = m + a  (correct: F = ma)")
    print("  Q3 - Wrong organelle: said Mitochondria  (correct: Chloroplast)")
    print("  Q4 - Calculation error: divided by 60 instead of 3600, got 1000 m/s  (correct: 16.67 m/s)")
    print("  Q5 - Swapped examples: listed insulators as conductors and vice versa")

const fs = require("fs");
const PDFDocument = require("pdfkit");
// function createInvoice(invoice, path) {

//     let doc = new PDFDocument({
//         size: "A4",
//         margin: 50
//     });

//     generateHeader(doc);
//     generateCustomerInformation(doc, invoice);
//     generateInvoiceTable(doc, invoice);
//     generateFooter(doc);

//     doc.end();
//     doc.pipe(fs.createWriteStream(path));
// }
async function createInvoice(invoice, path) {

    const pdfPromise = await new Promise(resolve => {
        const doc = new PDFDocument({
            size: "A4",
            margin: 50
        });

        generateHeader(doc);
        generateCustomerInformation(doc, invoice);
        generateInvoiceTable(doc, invoice);
        generateFooter(doc);

        doc.end();

        const buffers = []
        doc.on("data", buffers.push.bind(buffers))
        doc.on("end", () => {
            const pdfData = Buffer.concat(buffers)
            resolve(pdfData)
        })


        doc.pipe(fs.createWriteStream(path));
    })

}

function generateHeader(doc) {
    doc
        .image("./public/uploads/logo.png", 50, 45, {
            width: 100
        })
        .fillColor("#444444")
        .fontSize(20)
        //.text("EZFOODIE.", 110, 57)
        .fontSize(10)
        .text("EZFOODIE.", 200, 50, {
            align: "right"
        })
        .text("123 Main Street", 200, 65, {
            align: "right"
        })
        .text("New York, NY, 10025", 200, 80, {
            align: "right"
        })
        .moveDown();
}

function generateCustomerInformation(doc, invoice) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("Invoice", 50, 160);

    generateHr(doc, 185);

    const customerInformationTop = 200;

    doc
        .fontSize(10)
        .text("Invoice Number:", 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.invoice_nr, 125, customerInformationTop)
        .font("Helvetica")
        .text("Invoice Date:", 50, customerInformationTop + 15)
        .text(formatDate(new Date()), 125, customerInformationTop + 15)
        // .text("Balance Due:", 50, customerInformationTop + 30)
        // .text(
        //     formatCurrency(invoice.subtotal - invoice.paid),
        //     150,
        //     customerInformationTop + 30
        // )
        .font("Helvetica")
        .text("Ordered By:", 250, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.User.name, 250, customerInformationTop + 15)
        .font("Helvetica")
        .text(invoice.User.email, 250, customerInformationTop + 25)
        .text(invoice.User.phone)
        // .text(
        //     invoice.shipping.city +
        //     ", " +
        //     invoice.shipping.state +
        //     ", " +
        //     invoice.shipping.country,
        //     300,
        //     customerInformationTop + 30
        // )
        .font("Helvetica")
        .text("Ordered From:", 450, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.restaurant.name, 450, customerInformationTop + 15)
        .font("Helvetica")
        .text(invoice.restaurant.address)
        .moveDown();

    generateHr(doc, 300);
}

function generateInvoiceTable(doc, invoice) {
    let i;
    const invoiceTableTop = 350;

    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        invoiceTableTop,
        "Item",
        "Quantity",
        "",
        "Price"
    );
    generateHr(doc, invoiceTableTop + 20);

    doc.font("Helvetica");
    doc.font('./font/SentyGoldenBell.ttf')
    doc.fontSize(18);
    for (i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        const position = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            position,
            item.item,
            item.quantity,
            "",
            formatCurrency(item.amount)
        );

        generateHr(doc, position + 20);
    }
    doc.font("Helvetica");
    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
        doc,
        subtotalPosition,
        "",
        "",
        "Item Total:",
        formatCurrency(invoice.subtotal)
    );
    doc.font("Helvetica");
    const taxPosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        taxPosition,
        "",
        "",
        "Taxes:",
        formatCurrency(invoice.tax)
    );
    var totalPosition = taxPosition + 20;
    const discountApplyPosition = taxPosition + 20;
    const cloverPosition = discountApplyPosition + 20;
    if (invoice.promo != null && invoice.clover != null) {
        doc.font("Helvetica");
        totalPosition = cloverPosition + 20
        generateTableRow(
            doc,
            discountApplyPosition,
            "",
            "",
            "Promo(" + invoice.promo.name + "):",
            formatCurrency(invoice.promo.discount)
        );
        generateTableRow(
            doc,
            cloverPosition,
            "",
            "",
            "Clover Discount:",
            formatCurrency(invoice.clover)
        );
    } else if (invoice.promo != null) {
        doc.font("Helvetica");
        totalPosition = discountApplyPosition + 20
        generateTableRow(
            doc,
            discountApplyPosition,
            "",
            "",
            "Promo(" + invoice.promo.name + "):",
            formatCurrency(invoice.promo.discount)
        );
    } else if (invoice.clover != null) {
        doc.font("Helvetica");
        totalPosition = discountApplyPosition + 20
        generateTableRow(
            doc,
            discountApplyPosition,
            "",
            "",
            "Clover Discount:",
            formatCurrency(invoice.clover)
        );
    }

    doc.font("Helvetica-Bold");
    doc.fillColor("#175807");
    generateTableRow(
        doc,
        totalPosition,
        "",
        "",
        "Grand Total:",
        formatCurrency(invoice.total)
    );
    doc.font("Helvetica");
}

function generateFooter(doc) {
    doc
        .fontSize(8)
        .fillColor("#444444")
        .text(
            "Disclaimer: This is an acknowledgement of the Order you have placed.Details mention above including the menu price and taxes (as applicable) are as provided by the Restaurant to Ezfoodie.",
            50,
            750, {
                align: "left",
                width: 500
            }
        );
}

function generateTableRow(
    doc,
    y,
    item,
    quantity,
    unitCost,
    Price
) {
    doc
        .fontSize(10)
        .text(item, 50, y)
        // .text(description, 150, y)
        .text(quantity, 200, y, {
            width: 90,
            align: "right"
        })
        .text(unitCost, 370, y, {
            width: 90,
            align: "right"
        })
        .text(Price, 0, y, {
            align: "right"
        });
}

function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(cents) {
    return "$" + cents.toFixed(2);
}

function formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return year + "/" + month + "/" + day;
}

module.exports = {
    createInvoice
};
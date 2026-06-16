import { NextResponse } from "next/server";
import Stripe from "stripe";


const stripe = new Stripe(
    process.env.STRIPE_SECRET_KEY
);


export async function POST(req) {

    try {

        const body = await req.json();

        const session = await stripe.checkout.sessions.create({
            mode: "payment",

            line_items: [
                {
                    price_data: {
                        currency: "usd",

                        product_data: {
                            name: body.movieName,
                        },

                        unit_amount: body.amount * 100,
                    },

                    quantity: 1,
                },
            ],

            success_url:
                `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/test`,

            cancel_url:
                `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/test`,

            metadata: {
                orderId: body.orderId
            }
        });


        return Response.json({
            url: session.url
        });


    } catch (error) {

        console.log(error);

        return NextResponse.json(
            {
                error: "Stripe session failed"
            },
            {
                status: 500
            }
        );
    }
}

import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Note Search';
    const query = searchParams.get('q');

    const displayTitle = query ? `Search: ${query}` : title;

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#09090b', // zinc-950
                    color: 'white',
                    backgroundImage: 'radial-gradient(circle at 25% 25%, #2a2a2a 0%, #000 100%)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                    {/* Simple icon representation */}
                    <div style={{ width: 40, height: 40, background: '#f59e0b', borderRadius: '50%', marginRight: 15 }}></div>
                    <div style={{ fontSize: 30, color: '#a1a1aa' }}>Yukidouji Note Search</div>
                </div>

                <div
                    style={{
                        fontSize: 80,
                        fontWeight: 'bold',
                        background: 'linear-gradient(to bottom right, #ffffff, #71717a)',
                        backgroundClip: 'text',
                        color: 'transparent',
                        padding: '0 40px',
                        textAlign: 'center',
                        lineHeight: 1.1,
                    }}
                >
                    {displayTitle}
                </div>

                {query && (
                    <div style={{ marginTop: 30, fontSize: 30, color: '#fbbf24' }}>
                        Full-text search enabled
                    </div>
                )}
            </div>
        ),
        {
            width: 1200,
            height: 630,
        },
    );
}

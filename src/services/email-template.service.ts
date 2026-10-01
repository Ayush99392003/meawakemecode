import { UserProfile, Day, Problem, TrashBadgeInfo } from "../types/index.js";

export interface FormattedEmail {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplateService {
  /**
   * 1. Daily Curriculum Itinerary Email
   */
  static buildDailyItineraryEmail(
    user: { id?: string; email: string; unsubscribeToken?: string },
    day: { number: number; theme: string; summary: string },
    problems: Array<{ title: string; platform: string; difficulty: string; url: string; expectedTimeComplexity?: string | null }>,
    streaks: { currentStreak: number; longestStreak: number },
    baseUrl?: string
  ): FormattedEmail {
    const streakText = streaks.currentStreak > 0 ? ` (${streaks.currentStreak}-Day Streak)` : "";
    const subject = `Day ${day.number}/30: ${day.theme}${streakText} | meawakemecode`;
    const appUrl = baseUrl || process.env.APP_BASE_URL || "https://meawakemecode-8a35b.web.app";
    const unsubUrl = `${appUrl}/settings`;

    const problemRowsHtml = problems
      .map((p, idx) => {
        const platformBadge = p.platform === "LC" ? "LeetCode" : "Codeforces";
        return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px; font-weight: bold; color: #4f46e5;">#${idx + 1}</td>
          <td style="padding: 12px 8px;">
            <a href="${p.url}" target="_blank" style="color: #111827; text-decoration: none; font-weight: 600; font-size: 15px;">
              ${p.title}
            </a>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
              <span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${platformBadge}</span>
              <span style="margin-left: 6px;">Difficulty: ${p.difficulty}</span>
              ${p.expectedTimeComplexity ? ` • Time: ${p.expectedTimeComplexity}` : ""}
            </div>
          </td>
          <td style="padding: 12px 8px; text-align: right;">
            <a href="${p.url}" target="_blank" style="background: #4f46e5; color: #ffffff; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 500;">
              Solve
            </a>
          </td>
        </tr>`;
      })
      .join("");

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0c0a09; padding: 24px; color: #f5f5f4;">
      <div style="max-width: 600px; margin: 0 auto; background: #1c1917; border: 1px solid #292524; border-radius: 12px; overflow: hidden; padding: 28px;">
        <div style="border-bottom: 1px solid #292524; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #6366f1; font-size: 20px; margin: 0; font-weight: bold;">meawakemecode</h1>
          <p style="color: #a8a29e; font-size: 13px; margin: 4px 0 0 0;">30-Day Technical Interview Prep</p>
        </div>

        <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #ffffff;">Day ${day.number}: ${day.theme}</h2>
        <p style="color: #d6d3d1; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">${day.summary}</p>

        <div style="background: #292524; border: 1px solid #44403c; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px;">
          <strong style="color: #f59e0b;">Current Streak:</strong> ${streaks.currentStreak} Days 🔥
        </div>

        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #a8a29e; margin: 0 0 12px 0;">
          Today's 5-Problem Itinerary
        </h3>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tbody>${problemRowsHtml}</tbody>
        </table>

        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="${appUrl}/day/${day.number}" style="background: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block;">
            Open Day ${day.number} on Platform
          </a>
        </div>
      </div>
    </body>
    </html>`;

    const text = `meawakemecode - Day ${day.number}: ${day.theme}\nStreak: ${streaks.currentStreak} Days\n\nOpen Day ${day.number}: ${appUrl}/day/${day.number}`;
    return { subject, html, text };
  }

  /**
   * 2. Milestone Badge Earned Email
   */
  static buildBadgeEarnedEmail(
    userEmail: string,
    badgeTitle: string,
    badgeType: "day" | "week" | "streak",
    details: { dayNumber?: number; streakCount?: number; weekNumber?: number; totalSolved?: number }
  ): FormattedEmail {
    const appUrl = process.env.APP_BASE_URL || "https://meawakemecode-8a35b.web.app";
    const subject = `🏆 BADGE UNLOCKED: ${badgeTitle} | meawakemecode`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #09090b; padding: 24px; color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 32px; text-align: center;">
        
        <div style="width: 72px; height: 72px; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; border-radius: 50%; margin: 0 auto 20px auto; line-height: 72px; font-size: 32px;">
          🏆
        </div>

        <span style="display: inline-block; padding: 4px 12px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; border-radius: 9999px; font-size: 11px; font-family: monospace; font-weight: bold; color: #34d399; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
          Official Badge Verified
        </span>

        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">${badgeTitle}</h1>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; max-width: 460px; margin: 0 auto 24px auto;">
          You showed up, executed relentlessly, and locked in another verified milestone. Your momentum is undeniable.
        </p>

        <div style="background: #27272a; border: 1px solid #3f3f46; border-radius: 12px; padding: 16px; margin-bottom: 28px; display: inline-block; width: 80%; text-align: left;">
          ${details.dayNumber ? `<div style="font-size: 13px; color: #e4e4e7; margin-bottom: 6px;"><strong>Milestone:</strong> Day ${details.dayNumber} Cleared (5/5 Problems + Theory + MCQs)</div>` : ""}
          ${details.streakCount ? `<div style="font-size: 13px; color: #e4e4e7; margin-bottom: 6px;"><strong>Active Streak:</strong> ${details.streakCount} Consecutive Days 🔥</div>` : ""}
          ${details.totalSolved ? `<div style="font-size: 13px; color: #e4e4e7;"><strong>Total Solved:</strong> ${details.totalSolved} / 150 Problems</div>` : ""}
        </div>

        <div>
          <a href="${appUrl}/me" style="background: #10b981; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block;">
            View Diploma & Badges on Dashboard
          </a>
        </div>

        <div style="border-top: 1px solid #27272a; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #71717a;">
          meawakemecode • Zero Excuses. Pure Execution.
        </div>
      </div>
    </body>
    </html>`;

    const text = `🏆 BADGE UNLOCKED: ${badgeTitle}\nView your verified achievements at ${appUrl}/me`;
    return { subject, html, text };
  }

  /**
   * 3. Urgency Email: Complete It Before You Gain A Trash Badge
   */
  static buildTrashBadgeWarningEmail(
    userEmail: string,
    dayNumber: number,
    hoursLeft: number,
    currentStreak: number
  ): FormattedEmail {
    const appUrl = process.env.APP_BASE_URL || "https://meawakemecode-8a35b.web.app";
    const subject = `⚠️ URGENT: Complete Day ${dayNumber} before you earn the Slacker Trash Badge | meawakemecode`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0c0a09; padding: 24px; color: #f5f5f4;">
      <div style="max-width: 600px; margin: 0 auto; background: #1c1917; border: 2px solid #ef4444; border-radius: 16px; overflow: hidden; padding: 32px; text-align: center;">
        
        <div style="width: 72px; height: 72px; background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; border-radius: 50%; margin: 0 auto 20px auto; line-height: 72px; font-size: 32px;">
          🗑️
        </div>

        <span style="display: inline-block; padding: 4px 12px; background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 9999px; font-size: 11px; font-family: monospace; font-weight: bold; color: #f87171; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
          Accountability Warning · Streak At Risk
        </span>

        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 10px 0;">
          Only ~${hoursLeft} Hours Left to Finish Day ${dayNumber}
        </h1>

        <p style="color: #fca5a5; font-size: 14px; line-height: 1.6; max-width: 480px; margin: 0 auto 20px auto; font-style: italic;">
          &ldquo;One skipped day is how every abandoned goal begins. The engineer who takes your dream offer is practicing right now while you are procrastinating.&rdquo;
        </p>

        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 16px; margin: 0 auto 28px auto; text-align: left; max-width: 460px;">
          <div style="font-size: 13px; color: #fecaca; margin-bottom: 6px;">
            <strong>Active Streak:</strong> ${currentStreak} Days (will reset to 0 at midnight)
          </div>
          <div style="font-size: 13px; color: #fecaca;">
            <strong>Imminent Penalty:</strong> "Bronze Slacker: Comfort Addict" Trash Badge will be awarded to your profile.
          </div>
        </div>

        <div>
          <a href="${appUrl}/day/${dayNumber}" style="background: #ef4444; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 800; display: inline-block; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
            Solve Day ${dayNumber} &amp; Burn Trash Badge
          </a>
        </div>

        <div style="border-top: 1px solid #292524; margin-top: 32px; padding-top: 16px; font-size: 12px; color: #78716c;">
          You received this because you committed to the 30-Day Technical Prep program on meawakemecode.
        </div>
      </div>
    </body>
    </html>`;

    const text = `⚠️ URGENT: Only ~${hoursLeft} hours left to finish Day ${dayNumber} before you gain the Slacker Trash Badge.\nSolve now: ${appUrl}/day/${dayNumber}`;
    return { subject, html, text };
  }

  /**
   * 4. Accountability Email: Look, Things Can Be Tough But Quitting Won't Get You Anywhere
   */
  static buildToughLoveAccountabilityEmail(
    userEmail: string,
    missedDay: number,
    missedCount: number,
    roastQuote: string
  ): FormattedEmail {
    const appUrl = process.env.APP_BASE_URL || "https://meawakemecode-8a35b.web.app";
    const subject = `🔥 Look, things can be tough—but quitting won't get you anywhere | meawakemecode`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #09090b; padding: 24px; color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #3f3f46; border-radius: 16px; overflow: hidden; padding: 32px;">
        
        <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 20px; margin: 0; font-weight: bold;">meawakemecode</h1>
          <p style="color: #a1a1aa; font-size: 12px; margin: 4px 0 0 0;">Reverse Accountability Protocol</p>
        </div>

        <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3;">
          Look, things can be tough.<br>
          <span style="color: #f43f5e;">But quitting can't get you anywhere.</span>
        </h2>

        <div style="font-size: 14px; line-height: 1.7; color: #d4d4d8; space-y: 16px;">
          <p style="margin: 0 0 14px 0;">
            We noticed you slipped on Day ${missedDay}. You missed your quota, and right now your profile carries an active <strong>Trash Badge (${missedCount} days behind)</strong>.
          </p>

          <p style="margin: 0 0 14px 0;">
            Let's be completely real: <strong>Dynamic programming is brutal. System design at 100M QPS is intimidating. Life gets chaotic.</strong> We know it's hard.
          </p>

          <p style="margin: 0 0 14px 0;">
            <strong>But closing your IDE and walking away solves nothing.</strong> In six months, the tech companies will still be interviewing, the bar will still be high, and giving up today will only guarantee that you stay in the exact same spot tomorrow.
          </p>

          <div style="background: rgba(244, 63, 94, 0.1); border-left: 4px solid #f43f5e; padding: 14px 18px; margin: 20px 0; font-style: italic; color: #fda4af; font-size: 13.5px;">
            &ldquo;${roastQuote}&rdquo;
          </div>

          <p style="margin: 0 0 20px 0;">
            Every single engineer who cracked senior roles had days where they wanted to quit. The only difference is they sat down, opened problem #1, and wrote the code anyway.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0 24px 0;">
          <a href="${appUrl}/day/${missedDay}" style="background: #6366f1; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block;">
            Claw Back Day ${missedDay} Right Now
          </a>
        </div>

        <div style="border-top: 1px solid #27272a; padding-top: 16px; font-size: 12px; color: #71717a; text-align: center;">
          You can burn this Trash Badge and reclaim your momentum. All it takes is one solved problem today.
        </div>
      </div>
    </body>
    </html>`;

    const text = `Look, things can be tough—but quitting can't get you anywhere.\n\nClaw back Day ${missedDay}: ${appUrl}/day/${missedDay}`;
    return { subject, html, text };
  }

  /**
   * 5. Welcome Email: 30-Day Engineering Commitment & Reverse Accountability Onboarding
   */
  static buildWelcomeEmail(userEmail: string): FormattedEmail {
    const appUrl = process.env.APP_BASE_URL || "https://meawakemecode-8a35b.web.app";
    const subject = `⚡ Welcome to meawakemecode — 30-Day Engineering Commitment`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>${subject}</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #09090b; padding: 24px; color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 32px;">
        
        <!-- Header -->
        <div style="border-bottom: 1px solid #27272a; padding-bottom: 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <h1 style="color: #6366f1; font-size: 22px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">meawakemecode</h1>
            <p style="color: #a1a1aa; font-size: 13px; margin: 4px 0 0 0;">30-Day Technical Interview Prep &amp; Engineering Mastery</p>
          </div>
        </div>

        <!-- Hero Section -->
        <div style="text-align: center; padding: 12px 0 24px 0;">
          <div style="width: 72px; height: 72px; background: rgba(99, 102, 241, 0.15); border: 2px solid #6366f1; border-radius: 50%; margin: 0 auto 16px auto; line-height: 72px; font-size: 32px;">
            ⚡
          </div>
          <span style="display: inline-block; padding: 4px 14px; background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1; border-radius: 9999px; font-size: 11px; font-family: monospace; font-weight: bold; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">
            Commitment Initialized
          </span>
          <h2 style="font-size: 24px; font-weight: 800; color: #ffffff; margin: 0 0 10px 0; letter-spacing: -0.5px;">
            Your 30-Day Technical Sprint Starts Today
          </h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; max-width: 480px; margin: 0 auto;">
            Welcome aboard. You have officially committed to 30 continuous days of rigorous algorithmic discipline, core system design, and computer science fundamentals.
          </p>
        </div>

        <!-- Curriculum Pillars -->
        <div style="background: #27272a; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="font-size: 13px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #818cf8; margin: 0 0 14px 0;">
            The 30-Day Daily Structure
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 8px 0; color: #e4e4e7; vertical-align: top; width: 28px;">💻</td>
              <td style="padding: 8px 0; color: #d4d4d8;">
                <strong style="color: #ffffff;">5 Curated Problems Daily:</strong> 150 high-frequency LeetCode and Codeforces challenges ordered by cognitive progression.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #e4e4e7; vertical-align: top;">🧠</td>
              <td style="padding: 8px 0; color: #d4d4d8;">
                <strong style="color: #ffffff;">Deep CS Fundamentals:</strong> Concurrency, OS primitives, kernel memory, networking stack, and ACID databases.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #e4e4e7; vertical-align: top;">📐</td>
              <td style="padding: 8px 0; color: #d4d4d8;">
                <strong style="color: #ffffff;">Distributed System Design:</strong> Microservice latency budgets, CAP/PACELC trade-offs, and partition tolerance architectures.
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #e4e4e7; vertical-align: top;">🎯</td>
              <td style="padding: 8px 0; color: #d4d4d8;">
                <strong style="color: #ffffff;">60-Question Daily MCQ Gauntlet:</strong> Instant feedback drills testing implementation edge cases and asymptotic complexities.
              </td>
            </tr>
          </table>
        </div>

        <!-- Reverse Accountability Warning Box -->
        <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 12px; padding: 20px; margin-bottom: 28px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
            <span style="font-size: 18px;">🗑️</span>
            <strong style="color: #f87171; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
              The Reverse Accountability Protocol
            </strong>
          </div>
          <p style="color: #fca5a5; font-size: 13.5px; line-height: 1.6; margin: 0 0 10px 0;">
            Most coding platforms give you fake participation trophies. <strong>meawakemecode enforces reality:</strong>
          </p>
          <ul style="color: #fca5a5; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 18px;">
            <li>If you complete your daily quota, you earn verified mastery badges.</li>
            <li><strong>If you skip or procrastinate</strong>, your profile is branded with <em>Slacker Trash Badges</em> (Bronze, Silver, Gold, Diamond) and urgency accountability emails are triggered.</li>
            <li>The only way to erase a Trash Badge is to sit down and claw back your missed days.</li>
          </ul>
        </div>

        <!-- CTA Section -->
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${appUrl}/day/1" style="background: #6366f1; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);">
            Start Day 1: Array Manipulation &amp; Invariants →
          </a>
          <p style="color: #71717a; font-size: 12px; margin: 10px 0 0 0;">
            Your account is linked to <span style="font-family: monospace; color: #a1a1aa;">${userEmail}</span>. Solves sync seamlessly across all your devices.
          </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #27272a; margin-top: 32px; padding-top: 20px; font-size: 12px; color: #71717a; text-align: center;">
          <p style="margin: 0 0 6px 0; font-weight: 600; color: #a1a1aa;">Zero Excuses. Pure Execution.</p>
          meawakemecode • <a href="${appUrl}" style="color: #6366f1; text-decoration: none;">meawakemecode-8a35b.web.app</a>
        </div>
      </div>
    </body>
    </html>`;

    const text = `⚡ Welcome to meawakemecode — 30-Day Engineering Commitment\n\nYour 30-day technical sprint starts today.\n\nCurriculum Structure:\n- 150 Core Problems (5/day)\n- Deep CS Fundamentals & Concurrency\n- Distributed System Design & Bottlenecks\n- 60-Question Daily MCQ Retention Gauntlet\n\nReverse Accountability Protocol:\nIf you skip or miss days, you earn Slacker Trash Badges on your profile. The only way to burn them is to complete your work.\n\nStart Day 1 Now: ${appUrl}/day/1\nLinked Account: ${userEmail}`;

    return { subject, html, text };
  }
}

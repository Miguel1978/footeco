import React from 'react';
import { TrainingSession } from '../types';

interface PrintableTrainingSheetProps {
  session: TrainingSession;
}

export const PrintableTrainingSheet: React.FC<PrintableTrainingSheetProps> = ({ session }) => {
  // Format date from YYYY-MM-DD to DD.MM.YYYY
  const formattedDate = session.date.includes('-')
    ? session.date.split('-').reverse().join('.')
    : session.date;

  const renderDrawing = (drawing: { image?: string; coach?: string; caption?: string }) => {
    if (!drawing?.image) {
      return (
        <div className="w-full h-24 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
          (Zone de dessin libre)
        </div>
      );
    }

    const isSvg = drawing.image.startsWith('<svg');

    return (
      <div className="flex flex-col items-center justify-center w-full">
        <div className="w-full max-h-28 overflow-hidden rounded flex items-center justify-center">
          {isSvg ? (
            <div
              className="w-full h-28 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: drawing.image }}
            />
          ) : (
            <img
              src={drawing.image}
              alt="Schéma d'atelier"
              className="max-h-28 object-contain w-full"
            />
          )}
        </div>
        {drawing.coach && (
          <div className="mt-1 font-extrabold text-[11px] text-slate-950 text-left w-full pl-1">
            {drawing.coach}
          </div>
        )}
        {drawing.caption && (
          <div className="text-[9px] text-slate-700 font-semibold text-center mt-0.5 leading-tight">
            {drawing.caption}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="official-training-sheet-print"
      className="bg-white text-black p-4 font-sans text-xs w-full max-w-[210mm] mx-auto border border-black/20 print:border-none print:p-0"
    >
      {/* 1. Header Bar */}
      <table className="w-full border-collapse border-2 border-black mb-2 text-xs">
        <tbody>
          <tr className="border-b-2 border-black">
            <td className="p-1.5 font-extrabold border-r-2 border-black w-28 bg-slate-100">
              Entraînement
            </td>
            <td className="p-1.5 font-bold border-r-2 border-black">
              {session.team || 'FE12 Bas-Valais'}
            </td>
            <td className="p-1.5 font-extrabold border-r-2 border-black w-14 bg-slate-100 text-center">
              Date
            </td>
            <td className="p-1.5 font-bold border-r-2 border-black w-28 text-center">
              {formattedDate}
            </td>
            <td className="p-1.5 font-bold italic text-right pr-3 bg-slate-50">
              {session.coach || 'Sébastien M.'}
              {session.assistantCoach && ` • ${session.assistantCoach}`}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. Thème TE */}
      <table className="w-full border-collapse border-2 border-black mb-2 text-xs">
        <tbody>
          <tr>
            <td className="p-1.5 font-extrabold border-r-2 border-black w-28 text-center bg-slate-100">
              Thème TE
            </td>
            <td className="p-1.5 border-r-2 border-black whitespace-pre-line leading-tight w-2/5">
              {session.themeTE?.description || 'Geste technique à la récupération du ballon\nPasse, contrôle, dribble, ...'}
            </td>
            <td className="p-1.5 font-extrabold border-r-2 border-black w-28 text-center bg-slate-100">
              Accents de coaching
            </td>
            <td className="p-1.5 whitespace-pre-line leading-tight text-[11px]">
              {session.themeTE?.coachingAccents || 'Placement défensif\nDétermination et volonté de vouloir le ballon\nDéfendre ensemble'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 3. Thème TA */}
      <table className="w-full border-collapse border-2 border-black mb-2 text-xs">
        <tbody>
          <tr>
            <td className="p-1.5 font-extrabold border-r-2 border-black w-28 text-center bg-slate-100" rowSpan={2}>
              Thème TA
            </td>
            <td className="p-1.5 border-r-2 border-black whitespace-pre-line leading-tight w-2/5" rowSpan={2}>
              {session.themeTA?.description || 'Freiner et orienter l\'adversaire\nCouper les lignes de passe\nFermer l\'axe'}
            </td>
            <td className="p-1.5 font-extrabold border-r-2 border-black w-28 text-center bg-slate-100" rowSpan={2}>
              Accents de coaching
            </td>
            <td className="p-1 font-bold border-b border-r border-black w-24 text-center text-[10px] bg-slate-50">
              DEF ou OFF
            </td>
            <td className="p-1 font-bold border-b border-black text-center text-[10px] bg-slate-50">
              Antagonisme OFF et DEF
            </td>
          </tr>
          <tr>
            <td className="p-1 border-r border-black text-center font-bold text-xs">
              {session.themeTA?.defOrOff || 'OFF'}
            </td>
            <td className="p-1 text-center font-semibold text-[11px]">
              {session.themeTA?.antagonism || 'Volonté de vouloir gagner le ballon'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 4. Thème PE */}
      <table className="w-full border-collapse border-2 border-black mb-2 text-xs">
        <tbody>
          <tr>
            <td className="p-1 font-extrabold border-r-2 border-black w-28 text-center bg-slate-100">
              Thème PE
            </td>
            <td className="p-1 border-r-2 border-black whitespace-pre-line leading-tight w-2/5">
              {session.themePE?.description || ''}
            </td>
            <td className="p-1 font-extrabold border-r-2 border-black w-28 text-center bg-slate-100">
              Accents de coaching
            </td>
            <td className="p-1 whitespace-pre-line leading-tight text-[11px]">
              {session.themePE?.coachingAccents || ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Partie initiale - Focus TE/KO */}
      <table className="w-full border-collapse border-2 border-black mb-2 text-xs">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-black">
            <th className="p-1 text-left font-extrabold border-r-2 border-black w-1/3">
              {session.initialPart?.title || 'Partie initiale - Focus TE/KO'}
            </th>
            <th className="p-1 text-center font-extrabold border-r-2 border-black w-16">
              Durée
            </th>
            <th className="p-1 text-center font-extrabold border-r-2 border-black w-1/3">
              Dessin 1
            </th>
            <th className="p-1 text-center font-extrabold w-1/3">
              Dessin 2
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-1.5 border-r-2 border-black align-top text-[10.5px]">
              <div className="font-bold italic mb-1 text-slate-800">Description</div>
              <div className="whitespace-pre-line leading-snug">
                {session.initialPart?.description || 'Dessin 1 = Duel 1 contre 1...\nDessin 2 = Duel 1 contre 1...'}
              </div>
            </td>
            <td className="p-1 border-r-2 border-black align-middle text-center font-bold text-[11px] whitespace-pre-line">
              {session.initialPart?.duration || '2X\n15\nmin\n\nTotal\n30\nmin'}
            </td>
            <td className="p-1.5 border-r-2 border-black align-middle">
              {renderDrawing(session.initialPart?.drawing1)}
            </td>
            <td className="p-1.5 align-middle">
              {renderDrawing(session.initialPart?.drawing2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 6. Formes jouées - Focus TA */}
      <table className="w-full border-collapse border-2 border-black mb-2 text-xs">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-black">
            <th className="p-1 text-left font-extrabold border-r-2 border-black w-1/3">
              {session.playedForms?.title || 'Formes jouées - Focus TA'}
            </th>
            <th className="p-1 text-center font-extrabold border-r-2 border-black w-16">
              Durée
            </th>
            <th className="p-1 text-center font-extrabold border-r-2 border-black w-1/3">
              Dessin 1
            </th>
            <th className="p-1 text-center font-extrabold w-1/3">
              Dessin 2
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-1.5 border-r-2 border-black align-top text-[10.5px]">
              <div className="font-bold italic mb-1 text-slate-800">Description</div>
              <div className="whitespace-pre-line leading-snug">
                {session.playedForms?.description || 'Dessin 1 = 1 contre 1, 4 zones et 2 petits buts\n\nDessin 2 = Idem'}
              </div>
            </td>
            <td className="p-1 border-r-2 border-black align-middle text-center font-bold text-[11px] whitespace-pre-line">
              {session.playedForms?.duration || '2 X\n15min\n\nTotal\n30\nmin'}
            </td>
            <td className="p-1.5 border-r-2 border-black align-middle">
              {renderDrawing(session.playedForms?.drawing1)}
            </td>
            <td className="p-1.5 align-middle">
              {renderDrawing(session.playedForms?.drawing2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 7. Jeu final - Focus TE/TA */}
      <table className="w-full border-collapse border-2 border-black mb-2 text-xs">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-black">
            <th className="p-1 text-left font-extrabold border-r-2 border-black w-1/3">
              {session.finalGame?.title || 'Jeu final - Focus TE/TA'}
            </th>
            <th className="p-1 text-center font-extrabold border-r-2 border-black w-16">
              Durée
            </th>
            <th className="p-1 text-center font-extrabold border-r-2 border-black w-1/3">
              Dessin 1
            </th>
            <th className="p-1 text-center font-extrabold w-1/3">
              Dessin 2
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-1.5 border-r-2 border-black align-top text-[10.5px]">
              <div className="font-bold italic mb-1 text-slate-800">Description</div>
              <div className="whitespace-pre-line leading-snug">
                {session.finalGame?.description || 'Match 6 contre 6\n- Positionnement def\n- Détermination\n- Def et off ensemble'}
              </div>
            </td>
            <td className="p-1 border-r-2 border-black align-middle text-center font-bold text-[11px] whitespace-pre-line">
              {session.finalGame?.duration || '30 min'}
            </td>
            <td className="p-1.5 border-r-2 border-black align-middle">
              {renderDrawing(session.finalGame?.drawing1)}
            </td>
            <td className="p-1.5 align-middle">
              {renderDrawing(session.finalGame?.drawing2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 8. Remarques et individualisation */}
      <table className="w-full border-collapse border-2 border-black mb-1 text-xs">
        <tbody>
          <tr>
            <td className="p-2 border-r-2 border-black w-1/3 font-bold italic align-top bg-slate-50">
              Remarques et individualisation
            </td>
            <td className="p-2 align-top h-16 whitespace-pre-line text-[11px]">
              {session.remarksAndIndividualization || ''}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 9. Guide Individualisation & Contenus */}
      <div className="grid grid-cols-2 text-[10px] px-2 py-1 leading-snug mb-1 text-slate-800 font-medium">
        <div>
          <span className="font-bold block text-black">Individualisation</span>
          <div>- Intégration entraînement</div>
          <div>- Temps à disposition</div>
          <div>- Espace à disposition</div>
        </div>
        <div>
          <span className="font-bold block text-black">Contenus</span>
          <div>Travail spécifique à niveau</div>
          <div>Travail spécifique au poste</div>
          <div>Devoirs techniques</div>
        </div>
      </div>

      {/* 10. Bilan */}
      <table className="w-full border-collapse border-2 border-black text-xs">
        <tbody>
          <tr>
            <td className="p-2 border-r-2 border-black w-24 font-bold italic text-center align-middle bg-slate-50">
              Bilan
            </td>
            <td className="p-2 align-middle h-10 whitespace-pre-line text-[11px]">
              {session.bilan || ''}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

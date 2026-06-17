import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rangeParser from 'range-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { buscarEpisodiosPorPodcast, buscarEpisodioPorId } from '../repositories/episodios.repository.js';
import { buscarPodcastPorId } from '../repositories/podcasts.repository.js';
import { inserirComentario, buscarComentariosPorEpisodio } from '../repositories/comentarios.repository.js';
import { inserirAvaliacao, atualizarAvaliacao, buscarAvaliacaoPorUsuario } from '../repositories/avaliacoes.repository.js';
import { inserirFavorito, removerFavorito, verificarFavorito } from '../repositories/favoritos.repository.js';
import { inserirProgresso, buscarProgressoPorUsuario } from '../repositories/progresso.repository.js';

const AUDIO_DIR = path.join(__dirname, '../../public/audios');

export async function listarEpisodios(req, res) {
    const { podcodigo } = req.params;
    try {
        const episodios = await buscarEpisodiosPorPodcast(podcodigo);
        const podcast = await buscarPodcastPorId(podcodigo);
        res.render('episodios', {
            title: 'PodWave - Episódios',
            episodios,
            podnome: podcast ? podcast.podnome : `Podcast #${podcodigo}`,
            usuarioEmail: req.session.usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar episódios:', err);
        res.render('episodios', {
            title: 'PodWave - Episódios',
            episodios: [],
            podnome: `Podcast #${podcodigo}`,
            usuarioEmail: req.session.usuario.email,
            query: req.query
        });
    }
}

export async function exibirEpisodio(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const episodio = await buscarEpisodioPorId(epicodigo);
        if (!episodio) {
            return res.status(404).send('Episódio não encontrado');
        }

        const podcast = await buscarPodcastPorId(podcodigo);
        if (!podcast) {
            return res.status(404).send('Podcast não encontrado');
        }

        const comentarios = await buscarComentariosPorEpisodio(epicodigo);
        const avaliacaoUsuario = await buscarAvaliacaoPorUsuario(usuario.codigo, epicodigo);
        const isFavorito = await verificarFavorito(usuario.codigo, epicodigo);
        const progresso = await buscarProgressoPorUsuario(usuario.codigo, epicodigo);

        res.render('episodio-detalhe', {
            title: `PodWave - ${episodio.epititulo}`,
            episodio,
            podnome: podcast.podnome,
            comentarios: comentarios || [],
            avaliacaoUsuario: avaliacaoUsuario ? avaliacaoUsuario.avanota : null,
            isFavorito,
            progresso: progresso ? progresso.proprogresso : 0,
            usuarioEmail: usuario.email,
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar detalhes do episódio:', err);
        res.redirect(`/episodios/${podcodigo}?error=Erro ao carregar episódio`);
    }
}

export async function comentarEpisodio(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const { comentario } = req.body;
        await inserirComentario({
            usucodigo: usuario.codigo,
            podcodigo: parseInt(podcodigo),
            epicodigo: parseInt(epicodigo),
            comtexto: comentario,
            comdata: new Date().toISOString().split('T')[0]
        });
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao adicionar comentário:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao comentar`);
    }
}

export async function avaliarEpisodio(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const { nota } = req.body;

        if (!nota || isNaN(nota) || nota < 1 || nota > 5) {
            return res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Nota inválida. Use valores de 1 a 5.`);
        }

        const avaliacaoExistente = await buscarAvaliacaoPorUsuario(usuario.codigo, epicodigo);
        if (avaliacaoExistente) {
            await atualizarAvaliacao({
                usucodigo: usuario.codigo,
                epicodigo: parseInt(epicodigo),
                nota: parseInt(nota),
                data: new Date().toISOString().split('T')[0]
            });
        } else {
            await inserirAvaliacao({
                usucodigo: usuario.codigo,
                podcodigo: parseInt(podcodigo),
                epicodigo: parseInt(epicodigo),
                nota: parseInt(nota),
                data: new Date().toISOString().split('T')[0]
            });
        }

        res.redirect(`/episodios/${podcodigo}/${epicodigo}?avaliacao=${nota}`);
    } catch (err) {
        console.error('Erro ao avaliar episódio:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao processar a avaliação`);
    }
}

export async function alternarFavorito(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const isFavorito = await verificarFavorito(usuario.codigo, epicodigo);
        if (isFavorito) {
            await removerFavorito(usuario.codigo, epicodigo);
        } else {
            await inserirFavorito({
                usucodigo: usuario.codigo,
                podcodigo: parseInt(podcodigo),
                epicodigo: parseInt(epicodigo)
            });
        }
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao favoritar/desfavoritar:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao favoritar`);
    }
}

export async function salvarProgresso(req, res) {
    const usuario = req.session.usuario;
    const { podcodigo, epicodigo } = req.params;
    try {
        const { progresso_segundos } = req.body;
        // O INSERT ... ON DUPLICATE KEY UPDATE do repository já faz o upsert
        await inserirProgresso({
            usucodigo: usuario.codigo,
            epicodigo: parseInt(epicodigo),
            proprogresso: parseInt(progresso_segundos),
            prodata: new Date().toISOString().split('T')[0]
        });
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao atualizar progresso:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao atualizar progresso`);
    }
}

export function transmitirAudio(req, res) {
    const { epicodigo } = req.params;

    buscarEpisodioPorId(epicodigo)
        .then(episodio => {
            if (!episodio) {
                return res.status(404).send('Episódio não encontrado');
            }

            const audioFile = path.basename(episodio.epiaudio || episodio.epiurl);
            const audioPath = path.join(AUDIO_DIR, audioFile);

            if (!fs.existsSync(audioPath)) {
                return res.status(404).send('Arquivo de áudio não encontrado');
            }

            const stat = fs.statSync(audioPath);
            const fileSize = stat.size;
            const range = req.headers.range;

            if (range) {
                const ranges = rangeParser(fileSize, range);
                if (ranges === -1) {
                    return res.status(416).send('Range inválido');
                }
                if (ranges === -2) {
                    return res.status(200).send('Range não satisfazível');
                }

                const start = ranges[0].start;
                const end = ranges[0].end;
                const chunksize = end - start + 1;
                const file = fs.createReadStream(audioPath, { start, end });

                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg'
                });
                file.pipe(res);
            } else {
                res.writeHead(200, {
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg'
                });
                fs.createReadStream(audioPath).pipe(res);
            }
        })
        .catch(err => {
            console.error('Erro ao carregar áudio:', err);
            res.status(500).send('Erro ao carregar o áudio');
        });
}

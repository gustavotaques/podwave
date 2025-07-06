var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
const rangeParser = require('range-parser');
const {
    buscarEpisodiosPorPodcast,
    buscarPodcastPorId,
    buscarEpisodioPorId,
    inserirComentario,
    buscarComentariosPorEpisodio,
    inserirAvaliacao,
    buscarAvaliacaoPorUsuario,
    atualizarAvaliacao,
    inserirFavorito,
    removerFavorito,
    verificarFavorito,
    inserirProgresso,
    buscarProgressoPorUsuario
} = require('../banco');

router.get('/:podcodigo', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const { podcodigo } = req.params;
        const episodios = await buscarEpisodiosPorPodcast(podcodigo);
        const podcast = await buscarPodcastPorId(podcodigo);
        res.render('episodios', {
            title: 'PodWave - Episódios',
            episodios: episodios,
            podnome: podcast ? podcast.podnome : `Podcast #${podcodigo}`,
            usuarioEmail: global.usuarioEmail || '',
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar episódios:', err);
        res.render('episodios', {
            title: 'PodWave - Episódios',
            episodios: [],
            podnome: `Podcast #${podcodigo}`,
            usuarioEmail: global.usuarioEmail || '',
            query: req.query
        });
    }
});

router.get('/:podcodigo/:epicodigo', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    const { podcodigo } = req.params;
    const { epicodigo } = req.params;
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
        // Busca a avaliação do usuário atual no banco
        const avaliacaoUsuario = await buscarAvaliacaoPorUsuario(global.usuarioCodigo, epicodigo);
        const avanota = avaliacaoUsuario ? avaliacaoUsuario.avanota : null;
        const isFavorito = await verificarFavorito(global.usuarioCodigo, epicodigo);
        const progresso = await buscarProgressoPorUsuario(global.usuarioCodigo, epicodigo);

        res.render('episodio-detalhe', {
            title: `PodWave - ${episodio.epititulo}`,
            episodio: episodio,
            podnome: podcast.podnome,
            comentarios: comentarios || [],
            avaliacaoUsuario: avanota, // Passa o valor de avanota diretamente
            isFavorito: isFavorito,
            progresso: progresso ? progresso.proprogresso : 0,
            usuarioEmail: global.usuarioEmail || '',
            query: req.query
        });
    } catch (err) {
        console.error('Erro ao carregar detalhes do episódio:', err);
        res.redirect(`/episodios/${podcodigo}?error=Erro ao carregar episódio`);
    }
});

router.post('/:podcodigo/:epicodigo/comentar', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const { podcodigo } = req.params;
        const { epicodigo } = req.params;
        const { comentario } = req.body;
        await inserirComentario({
            usucodigo: global.usuarioCodigo,
            epicodigo: parseInt(epicodigo),
            comtexto: comentario,
            comdata: new Date().toISOString().split('T')[0]
        });
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao adicionar comentário:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao comentar`);
    }
});

router.post('/:podcodigo/:epicodigo/avaliar', async function (req, res, next) {
    if (!global.usuarioCodigo) {
        return res.redirect('/login'); // Redireciona para login se não autenticado
    }

    try {
        const { podcodigo } = req.params;
        const { epicodigo } = req.params;
        const { nota } = req.body;

        // Validação básica da nota
        if (!nota || isNaN(nota) || nota < 1 || nota > 5) {
            return res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Nota inválida. Use valores de 1 a 5.`);
        }

        const avaliacaoExistente = await buscarAvaliacaoPorUsuario(global.usuarioCodigo, epicodigo);
        if (avaliacaoExistente) {
            await atualizarAvaliacao({
                usucodigo: global.usuarioCodigo,
                epicodigo: parseInt(epicodigo),
                nota: parseInt(nota),
                data: new Date().toISOString().split('T')[0]
            });
        } else {
            await inserirAvaliacao({
                usucodigo: global.usuarioCodigo,
                epicodigo: parseInt(epicodigo),
                nota: parseInt(nota),
                data: new Date().toISOString().split('T')[0]
            });
        }

        // Redireciona de volta com a nova avaliação na query string
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?avaliacao=${nota}`);
    } catch (err) {
        console.error('Erro ao avaliar episódio:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao processar a avaliação`);
    }
});

router.post('/:podcodigo/:epicodigo/favoritar', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const { podcodigo } = req.params;
        const { epicodigo } = req.params;
        const isFavorito = await verificarFavorito(global.usuarioCodigo, epicodigo);
        if (isFavorito) {
            await removerFavorito(global.usuarioCodigo, epicodigo);
        } else {
            await inserirFavorito({
                usucodigo: global.usuarioCodigo,
                epicodigo: parseInt(epicodigo),
                data: new Date().toISOString().split('T')[0]
            });
        }
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao favoritar/desfavoritar:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao favoritar`);
    }
});

router.post('/:podcodigo/:epicodigo/progresso', async function (req, res, next) {
    if (!global.usuarioCodigo) return res.redirect('/login');
    try {
        const { podcodigo } = req.params;
        const { epicodigo } = req.params;
        const { progresso_segundos } = req.body;
        const progressoExistente = await buscarProgressoPorUsuario(global.usuarioCodigo, epicodigo);
        if (progressoExistente) {
            await inserirProgresso({
                usucodigo: global.usuarioCodigo,
                epicodigo: parseInt(epicodigo),
                proprogresso: parseInt(progresso_segundos), // Ajuste para proprogresso
                prodata: new Date().toISOString().split('T')[0] // Ajuste para prodata
            });
        } else {
            await inserirProgresso({
                usucodigo: global.usuarioCodigo,
                epicodigo: parseInt(epicodigo),
                proprogresso: parseInt(progresso_segundos), // Ajuste para proprogresso
                prodata: new Date().toISOString().split('T')[0] // Ajuste para prodata
            });
        }
        res.redirect(`/episodios/${podcodigo}/${epicodigo}`);
    } catch (err) {
        console.error('Erro ao atualizar progresso:', err);
        res.redirect(`/episodios/${podcodigo}/${epicodigo}?error=Erro ao atualizar progresso`);
    }
});

router.get('/:podcodigo/:epicodigo/audio', (req, res, next) => {
    const { podcodigo } = req.params;
    const { epicodigo } = req.params;
    
    buscarEpisodioPorId(epicodigo)
        .then(episodio => {
            if (!episodio) {
                console.log(`Episódio não encontrado: epicodigo=${epicodigo}`);
                return res.status(404).send('Episódio não encontrado');
            }

            const audioFile = episodio.epiaudio || episodio.epiurl;
            console.log(`Audio file: ${audioFile}`); // Log do arquivo esperado
            const audioPath = path.join(__dirname, '../public/audios', audioFile);
            console.log(`Audio path: ${audioPath}`); // Log do caminho completo

            if (!fs.existsSync(audioPath)) {
                console.log(`Arquivo não encontrado em: ${audioPath}`);
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

                const head = {
                    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                    'Accept-Ranges': 'bytes',
                    'Content-Length': chunksize,
                    'Content-Type': 'audio/mpeg',
                };

                res.writeHead(206, head);
                file.pipe(res);
            } else {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'audio/mpeg',
                };
                res.writeHead(200, head);
                fs.createReadStream(audioPath).pipe(res);
            }
        })
        .catch(err => {
            console.error('Erro ao carregar áudio:', err);
            res.status(500).send('Erro ao carregar o áudio');
        });
});

module.exports = router;